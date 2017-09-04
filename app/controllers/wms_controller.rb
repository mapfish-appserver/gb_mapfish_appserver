require 'net/http.rb'
require 'uri'

class WmsController < ApplicationController

  def show
    logger.debug "----> WMS call with user '#{current_user.try(:login)}'"

    topic_name = params[:service]
    topic = Topic.where(:name => topic_name).first
    add_sld_body(topic)
    add_filter(topic_name)

    #Send redirect for public services
    if MAPSERV_REDIRECT && request.get? && public?(topic_name, host_zone(request.host))
      url, path = mapserv_request_url(request)
      #expires_in 2.minutes, :public => true #FIXME: cache_path "wms-public-#{topic_name}-#{host_zone(request.host)}"
      redirect_to "#{url.scheme}://#{url.host}:#{url.port}#{path}"
      return
    end

    topic_accessible = topic && can?(:show, topic)
    wms_accessible = can?(:show, Wms.new(topic_name))

    if topic_accessible && !wms_accessible
      topic_accessible = session_ok?
      if !topic_accessible
        logger.info "----> WMS '#{topic_name}' not accessible without valid session!"
      end
    end
    if !topic_accessible && !wms_accessible && !print_request? # allow all topics for print servlet
      logger.info "----> Topic/WMS '#{topic_name}' not accessible with roles #{current_roles.roles.collect(&:name).join('+')}!"
      log_user_permissions(:show, topic) if topic
      log_user_permissions(:show, Wms.new(topic_name))
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
    uri = URI.parse("#{url.scheme}://#{url.host}:#{url.port}#{path}")
    logger.info "Forward request: #{uri}"

    if request.get?
      result = Net::HTTP.get_response(uri)
      send_data result.body, :status => result.code, :type => result.content_type, :disposition => 'inline'
    else
      #POST
      http = Net::HTTP.new(uri.host, uri.port)
      req = Net::HTTP::Post.new(path)
      post_params = []
      post_params += url.query.split(/&|=/) if url.query
      data = Hash[*post_params]
      data.merge!(params)
      data.merge!('SLD_BODY' => URI.unescape(request.query_string.split(/SLD_BODY=/)[-1])) if request.query_string.include?('SLD_BODY=')
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
      sld_body = Wms.sld_selection(layer, params[:SELECTION][:PROPERTY], params[:SELECTION][:VALUES].split(','))
      # Remove non-WMS params
      request.env["QUERY_STRING"].gsub!(/(^|&)SELECTION.+?(?=(&|$))/, '')
      #params.delete(:SELECTION)
      # add serverside SLD for selection
      request.env["QUERY_STRING"] += "&SLD_BODY=" + URI.escape(sld_body)
    end
  end

  def add_filter(topic_name)
    unless params[:LAYERS].blank?
      filters = Wms.access_filters(current_ability, current_user, topic_name, params[:LAYERS].split(','))
      if filters.any?
        # remove existing filters
        filters.each do |key, value|
          request.env["QUERY_STRING"].gsub!(/(^|&)#{key}=.+?(?=(&|$))/, '')
        end
        # add serverside filters
        request.env["QUERY_STRING"] += "&#{filters.to_query}"
      end
    end
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
      elsif user_signed_in?
        # user has just signed in via basic auth or token, and there is no session yet
        logger.info "User '#{current_user.try(:login)}' just signed in, no session yet"
        true
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
