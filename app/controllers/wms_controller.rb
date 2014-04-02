require 'net/http.rb'
require 'uri'

class WmsController < ApplicationController

  def show
    logger.debug "----> WMS call with user '#{current_user.try(:login)}'"

    topic = Topic.where(:name => params[:service]).first
    add_sld_body(topic)

    #Send redirect for public services
    if request.get? && public?(params[:service], host_zone(request.host))
      url, path = mapserv_request_url(request)
      #expires_in 2.minutes, :public => true #FIXME: cache_path "wms-public-#{params[:service]}-#{host_zone(request.host)}"
      redirect_to "#{url.scheme}://#{url.host}#{path}"
      return
    end

    topic_accessible = topic && can?(:show, topic)
    wms_accessible = can?(:show, Wms.new(params[:service]))
    if topic_accessible && !wms_accessible
      topic_accessible = session_ok?
      if !topic_accessible
        logger.info "----> WMS '#{params[:service]}' not accessible without valid session!"
      end
    end
    if !topic_accessible && !wms_accessible && !print_request? # allow all topics for print servlet
      logger.info "----> Topic/WMS '#{params[:service]}' not accessible with roles #{current_roles.roles.collect(&:name).join('+')}!"
      log_user_permissions(:show, topic) if topic
      log_user_permissions(:show, Wms.new(params[:service]))
      request_http_basic_authentication('Secure WMS Login')
      return
    end
    call_wms(request)
  end

  # Return 200 for direct accessible WMS and 404 for protected WMS
  def access
    accessible = public?(params[:service], host_zone(request.host))
    expires_in 2.minutes, :public => true
    if !accessible
      render :nothing => true, :status => 404
    else
      render :nothing => true
    end
  end

  def mapserv
    require 'lib/mapserver'
    @@wms = nil if Rails.env.development?
    path = File.expand_path(File.join(Rails.root, 'mapserver', 'maps', @zone))
    @@wms ||= Mapserver.new(nil, File.join(path, "#{params[:service]}.map"))
    status, type, body = @@wms.call(request.env)
    send_data body, :type => type['Content-Type'], :status => status, :disposition => 'inline'
  end

  private

  def mapserv_base_url(request)
    server = MAPSERV_SERVER || "#{request.protocol}#{request.host}"
    use_cgi = request.parameters.any? { |param, value| param =~ LAYER_FILTER_REGEX }
    "#{server}#{use_cgi ? MAPSERV_CGI_URL : MAPSERV_URL}?MAP=#{MAPPATH}/#{@zone}/#{params[:service]}.map"
  end

  def mapserv_request_url(request)
    wms_url = mapserv_base_url(request)
    url = URI.parse(URI.decode(wms_url))
    if url.host.nil?
      url = URI.parse(URI.decode("#{request.protocol}#{wms_url}"))
    end
    if url.host.nil?
      url = URI.parse(URI.decode("#{request.protocol}#{request.host}#{wms_url}"))
    end

    path = if request.get?
      path = "#{url.path}?"
      path << url.query << '&' if url.query
      path << request.query_string
      path
    else
      url.path
    end
    [url, path]
  end

  def call_wms(request)
    url, path = mapserv_request_url(request)
    logger.info "Forward request: #{url.scheme}://#{url.host}#{path}"

    if request.get?
      result = Net::HTTP.get_response(url.host, path, url.port)
      send_data result.body, :status => result.code, :type => result.content_type, :disposition => 'inline'
    else
      #POST
      http = Net::HTTP.new(url.host, url.port)
      req = Net::HTTP::Post.new(path)
      post_params = []
      post_params += url.query.split(/&|=/) if url.query
      data = Hash[*post_params]
      data.merge!(params)
      data.merge!('SLD_BODY' => request.query_string.split(/SLD_BODY=/)[-1]) if request.query_string.include?('SLD_BODY=')
      logger.info "WMS POST with #{data.inspect}"
      req.set_form_data(data)
      result = http.request(req)
      send_data result.body, :status => result.code, :type => result.content_type, :disposition => 'inline'
    end
  end

  def add_sld_body(topic)
    unless params[:SELECTION].nil?
      layer = topic.layers.find_by_name(params[:SELECTION][:LAYER])
      if layer.nil?
        logger.info "Selection layer '#{params[:SELECTION][:LAYER]}' not found in topic '#{topic.name}'"
        return
      end
      #Remove non-WMS params
      request.env["QUERY_STRING"].gsub!(/&SELECTION.+?(?=&)/, '')
      # add serverside SLD for selection
      request.env["QUERY_STRING"] += "&SLD_BODY=" + URI.escape(
        sld_selection(layer, params[:SELECTION][:PROPERTY], params[:SELECTION][:VALUES].split(',')))
    end
  end

  def sld_selection(layer, filter_property, filter_values)
    sld = '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" version="1.0.0" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">'
    sld <<  "<NamedLayer>"
    sld <<    "<Name>#{layer.name}</Name>"
    sld <<    "<UserStyle>"
    sld <<      "<Name>default</Name>"
    sld <<      "<FeatureTypeStyle>"

    filter_values.each do |value|
      # NOTE: use a separate rule for each value as workaround, as combined filter with <ogc:Or> does not work as expected
      sld <<      "<Rule>"
      sld <<        "<Name>show-#{value}</Name>"
      sld <<        '<ogc:Filter>'
      sld <<          "<ogc:PropertyIsEqualTo>"
      sld <<            "<ogc:PropertyName>#{filter_property}</ogc:PropertyName>"
      sld <<            "<ogc:Literal>#{value}</ogc:Literal>"
      sld <<          "</ogc:PropertyIsEqualTo>"
      sld <<        "</ogc:Filter>"
      sld << layer.selection_symbolizer
      sld <<        "<MinScaleDenominator>0</MinScaleDenominator>"
      sld <<        "<MaxScaleDenominator>999999999</MaxScaleDenominator>"
      sld <<      "</Rule>"
    end

    sld <<      "</FeatureTypeStyle>"
    sld <<    "</UserStyle>"
    sld <<  "</NamedLayer>"
    sld << "</StyledLayerDescriptor>"

    sld
  end

  #Public accessible WMS
  #REMARK: permission change needs restart!
  def public?(name, zone)
    @@accessible ||= {}
    @@accessible[zone] ||= {}
    @@accessible[zone][name] ||= begin
      test_ability = Ability.new(Ability::Roles.new(nil, zone)) # additional param for request origin?
      test_ability.can?(:show, Wms.new(name))
    end
  end

  def session_ok?
      #access only from GB viewer - check for valid session
      if session.exists?
        if !session[:map_ts]
          logger.info "Warning: session[:map_ts] missing! session #{@zone}: #{session.inspect}"
          true
        else
          age = Time.now - session[:map_ts]
          logger.debug "session check for wms access. map_ts: #{session[:map_ts].inspect} age: #{age}s"
          if age >= 12*3600 #12h
            logger.info "Warning: session too old (age: #{age/3600}h)!"
          end
          true
        end
      else
        logger.info "No session info! headers #{@zone}: #{request.headers.inspect}" 
        false
      end
  end

  def print_request?
    # MapFish Print user agent, TODO: more checks like local request or access token
    request.headers["HTTP_USER_AGENT"] == "Jakarta Commons-HttpClient/3.1"
  end

end
