#Mapfish print controller with access control and servlet call

class PrintController < ApplicationController
  begin
    require 'RMagick'
  rescue LoadError
    ActionController::Base.logger.info "Couldn't find RMagick. Image export not supported"
  end

  skip_before_filter :verify_authenticity_token, :only => :create # allow /print/create with POST

  #cache info.json
  caches_action :info, :cache_path => Proc.new { { :proto => request.protocol } }

  class JavaError < Exception
    def initialize(cmd, message)
      super(cmd + "\n\n" + message)
    end
  end

  class MapfishError < Exception
    def initialize(cmd, message)
      super(cmd + "\n\n" + message)
    end
  end

  def initialize
    @configFile = "#{Rails.root}/print/config.yaml"
  end

  TMP_PREFIX = "#{PRINT_TMP_PATH}/mfPrintTempFile"
  TMP_SUFFIX = ".pdf"
  TMP_PURGE_SECONDS = 600

  OUTPUT_FORMATS = ["pdf", "png", "jpg", "tif", "gif"]
  MAPFISH_PRINT_OUTPUT_FORMATS = ["pdf", "png", "tif", "gif", "bmp"]

  def info
    # return v2 print info format for GbPrintPanel
    info = {}
    info['createURL'] = url_for(:protocol => request.protocol, :action=>'create') + '.json'

    # add output formats
    info['outputFormats'] = []
    OUTPUT_FORMATS.each do |output_format|
      info['outputFormats'] << {:name => output_format}
    end

    # add scales
    info['scales'] = print_scales.collect do |scale|
      {:name => "1:#{scale}", :value => scale}
    end

    # add dpis
    info['dpis'] = print_dpis.collect do |dpi|
      {:name => "#{dpi}", :value => dpi}
    end

    # NOTE: load templates directly from YAML instead of parsing the Mapfish Print capabilities
    mapfish_config = YAML.load(File.read(@configFile))

    # parse layouts
    info['layouts'] = []
    mapfish_config['templates'].each do |name, template|
      # skip custom templates
      next if template['attributes'].has_key?('gb_custom_template')

      map = template['attributes']['map']
      # skip if no map
      next if map.nil?

      info['layouts'] << {
        :name => name,
        :map => {
          :width => map['width'],
          :height => map['height'],
        },
        :rotation => true
      }
    end

    respond_to do |format|
      format.json do
        if params[:var]
          render :text => "var #{params[:var]} = #{info.to_json};"
        else
          render :json => info
        end
      end
    end
  end

  def create
    unless check_permissions
      head :forbidden
      return
    end

    cleanupTempFiles

    # remove Rails params
    controller = request.parameters.delete('controller')
    request.parameters.delete('action')
    request.parameters.delete('format')
    request.parameters.delete(controller) unless controller.nil?

    accessible_topics = Topic.accessible_by(current_ability).collect{ |topic| topic.name }
    layers_to_delete = []
    request.parameters["layers"].each do |layer|
      if layer["baseURL"] # WMS layers
        topic_name = File.basename(URI.parse(layer["baseURL"]).path)
        if accessible_topics.include?(topic_name)
          # rewrite URL for local WMS, use CGI if layer filter is used
          use_cgi = !layer["customParams"].nil? && layer["customParams"].any? { |param, value| param =~ LAYER_FILTER_REGEX }
          layer["baseURL"] = rewrite_wms_uri(layer["baseURL"], use_cgi)
          if layer["customParams"] #Set map_resolution for mapserver (MapFish print bug?)
            layer["customParams"].delete("DPI")
            layer["customParams"]["map_resolution"] = request.parameters["dpi"]
          end

          topic = Topic.find_by_name(topic_name)
          add_sld_body(topic, layer)
          add_filter(topic_name, layer)

          # For permission check in WMS controller: pass session as WMS request parameter
          #layer["customParams"]["session"] =
        else
          # collect inaccessible layers for later removal
          layers_to_delete << layer
        end
      end

      if layer["baseURL"].nil? && layer["styles"] #Vector layers
        layer["styles"].each_value do |style| #NoMethodError (undefined method `each_value' for [""]:Array):
          if style["externalGraphic"]
            style["externalGraphic"].gsub!(LOCAL_GRAPHICS_HOST, '127.0.0.1')
            style["externalGraphic"].gsub!(/^https:/, 'http:')
            style["externalGraphic"].gsub!(/^\//, 'http://127.0.0.1/')
          end
        end
      end
    end
    # remove inaccessible layers
    request.parameters["layers"] -= layers_to_delete

    request.parameters["pages"].each do |page|
      # round center coordinates
      page["center"].collect! {|coord| (coord * 100.0).round / 100.0  }
      # round extent coordinates
      page["extent"].collect! {|coord| (coord * 100.0).round / 100.0  } unless page["extent"].nil?
      # add blank user strings if missing
      page["user_title"] = " " if page["user_title"].blank?
      page["user_comment"] = " " if page["user_comment"].blank?
      # base url
      page["base_url"] = "#{request.protocol}#{request.host}"
      # disclaimer
      topic = Topic.accessible_by(current_ability).where(:name => page["topic"]).first
      page["disclaimer"] = topic.nil? ? Topic.default_print_disclaimer : topic.print_disclaimer
    end

    report = request.parameters["layout"]
    if print_templates.include?(report)
      # Mapfish
      print_params = convert_mapfish_v2_params(request.parameters)
      output_format = print_params["outputFormat"]

      # add any custom params
      set_custom_print_params(report, print_params)

      # create report
      temp, temp_id = mapfish_print(print_params)

      # send link to print result
      respond_to do |format|
        format.json do
          render :json => { 'getURL' => url_for(:action => 'show', :id => temp_id) + ".#{output_format}" }
        end
      end
    else
      # JasperReport
      call_report(request.parameters["report"], request)
    end
  end

  def show
    unless check_permissions
      head :forbidden
      return
    end

    output_format = params[:format]
    type = nil
    if OUTPUT_FORMATS.include?(output_format)
      case output_format
      when "pdf"
        type = 'application/x-pdf'
      when "png"
        type = 'image/png'
      when "jpg"
        type = 'image/jpeg'
      when "tif"
        type = 'image/tiff'
      when "gif"
        type = 'image/gif'
      end
    else
      # invalid format
      head :bad_request
      return
    end
    is_mapfish_print_id = (params[:id] =~ /^[0-9]+$/)
    if is_mapfish_print_id
      # deliver document generated previously by create()
      temp = TMP_PREFIX + params[:id] + ".#{output_format}"
      send_file temp, :type => type, :disposition => 'attachment', :filename => params[:id] + ".#{output_format}"
    else
      # create document
      report = params[:id]
      if custom_print_templates.include?(report)
        # Mapfish custom report

        # minimal Mapfish print params
        print_params = params.reject {|p| ['id', 'controller', 'action', 'format'].include?(p) }
        print_params['layout'] = report
        print_params['outputFormat'] = output_format
        print_params['attributes'] = {}
        print_params['dpi'] = print_params['dpi'] || print_dpis.first

        # add any custom params
        set_custom_print_params(report, print_params)

        # create report
        temp, temp_id = mapfish_print(print_params)

        default_filename = "#{report}.#{output_format}"
        send_custom_report(report, print_params, temp, type, default_filename)
      else
        # JasperReport
        create_and_send_jasper_report(report, request, type, "#{report}.pdf")
      end
    end
  end

  def add_sld_body(topic, layer)
    # add SLD for selection
    unless layer["customParams"]["SELECTION[LAYER]"].blank?
      sellayer = topic.layers.find_by_name(layer["customParams"]["SELECTION[LAYER]"])
      if sellayer.nil?
        logger.info "Selection layer '#{layer["customParams"]["SELECTION[LAYER]"]}' not found in topic '#{topic.name}'"
        return
      end
      sld_body = Wms.sld_selection(sellayer,
        layer["customParams"]["SELECTION[PROPERTY]"],
        layer["customParams"]["SELECTION[VALUES]"].split(',')
      )
      layer["customParams"]["SLD_BODY"] = sld_body

      # remove non-WMS params
      layer["customParams"].delete("SELECTION[LAYER]")
      layer["customParams"].delete("SELECTION[PROPERTY]")
      layer["customParams"].delete("SELECTION[VALUES]")
    end
  end

  def add_filter(topic_name, layer)
    filters = Wms.access_filters(current_ability, current_user, topic_name, layer["layers"])
    if filters.any?
      filters.each do |key, value|
        # remove existing filter
        layer["customParams"].delete(key)
        # add serverside filter
        layer["customParams"][key] = value
      end
    end
  end

  protected

  def print_scales
    if defined? PRINT_SCALES
      # from config
      PRINT_SCALES
    else
      # default
      [500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 200000, 500000]
    end
  end

  def print_dpis
    if defined? PRINT_DPIS
      # from config
      PRINT_DPIS
    else
      # default
      [150, 300]
    end
  end

  def print_templates
    @print_templates ||= begin
      # get all templates from Mapfish print config
      mapfish_config = YAML.load(File.read(@configFile))
      mapfish_config['templates'].keys
    end
  end

  def custom_print_templates
    @custom_print_templates ||= begin
      # get custom templates from Mapfish print config
      mapfish_config = YAML.load(File.read(@configFile))
      mapfish_config['templates'].keep_if {|k, v| v['attributes'].has_key?('gb_custom_template') }.keys
    end
  end

  # check permission for printing, e.g. check params to limit reports to user roles
  # override in descendant classes
  def check_permissions
    true
  end

  def rewrite_wms_uri(url, use_cgi)
    #http://wms.zh.ch/basis -> http://127.0.0.1/cgi-bin/mapserv.fcgi?MAP=/opt/geodata/mapserver/maps/intranet/basis.map&
    out = url
    # get topic from layer URL
    uri = URI.parse(url)
    localwms = LOCAL_WMS.any? { |ref| uri.host =~ ref }
    if localwms
      topic = File.basename(uri.path)
      localhost = 'localhost' #TODO: site specific configuration
      out = "http://#{localhost}#{use_cgi ? MAPSERV_CGI_URL :  MAPSERV_URL}?MAP=#{MAPPATH}/#{@zone}/#{topic}.map&"
      #out = "http://#{localhost}:#{request.port}/wms/#{topic}"
    end
    out
  end

  # add custom print params according to report type, e.g. add map and zoom to feature in custom reports
  # override in descendant classes
  def set_custom_print_params(report, print_params)
=begin example
    case report
    when "TopicName"
      # add map and layer
      layer_url = rewrite_wms_uri("#{wms_host}/TopicName", false)
      print_params['attributes']['map'] = {
        :dpi => print_params[:dpi],
        :bbox => [669242, 223923, 716907, 283315],
        :projection => 'EPSG:21781',
        :layers => [
          {
            :type => 'WMS',
            :baseURL => layer_url,
            :layers => ['Layer1', 'Layer2'],
            :imageFormat => 'image/png; mode=8bit',
            :styles => [''],
            :customParams => {
              :TRANSPARENT => true,
              :map_resolution => print_params['dpi']
            }
          }
        ]
      }
    end
=end
  end

  def mapfish_print(print_params)
    output_format = print_params["outputFormat"]
    unless MAPFISH_PRINT_OUTPUT_FORMATS.include?(output_format)
      # convert to raster from pdf
      print_params['outputFormat'] = 'pdf'
    end

    logger.info "Mapfish Print v3: #{print_params.to_yaml}"

    temp_id = SecureRandom.random_number(2**31)
    temp_mapfish = "#{TMP_PREFIX}#{temp_id.to_s}.#{print_params['outputFormat']}"

    if PRINT_URL.present?
      # call Mapfish Print servlet
      data = {
        :spec => print_params.to_json
      }
      response = call_servlet('POST', "buildreport.#{print_params['outputFormat']}", data)
      File.open(temp_mapfish, 'wb') {|f| f.write(response.body) }
    else
      # call Mapfish Print standalone
      print_standalone(print_params, temp_mapfish)
    end

    temp = temp_mapfish
    unless MAPFISH_PRINT_OUTPUT_FORMATS.include?(output_format)
      # convert PDF to image if not supported by Mapfish Print
      pdf = Magick::Image.read(temp_mapfish) { self.density = print_params['dpi'] }.first
      temp_img = "#{TMP_PREFIX}#{temp_id.to_s}.#{output_format}"
      pdf.alpha(Magick::RemoveAlphaChannel)
      pdf.write(temp_img)
      File.delete(temp_mapfish)
      temp = temp_img
    end

    return temp, temp_id
  end

  def call_servlet(method, action, print_params=nil)
    begin
      url = URI.parse(URI.decode("#{PRINT_URL}/#{action}"))
      logger.info "Forward request: #{method} #{url}"

      case method
      when 'GET'
        # add params to URL
        url = URI.parse("#{url}?#{print_params.to_param}") unless print_params.nil?
        response = Net::HTTP.get_response(url)
      when 'POST'
        http = Net::HTTP.new(url.host, url.port)
        req = Net::HTTP::Post.new(url.path)
        req.set_form_data(print_params)
        response = http.request(req)
      else
        raise Exception.new("Unsupported method '#{method}'")
      end
    rescue => err
      raise MapfishError.new("#{method} #{url}\n#{print_params.to_json}", "#{err.class}: #{err.message}")
    end

    if response.code != '200'
      raise MapfishError.new("#{method} #{url}\n#{print_params.to_json}", response.body)
    end

    response
  end

  def baseCmd(config_file = nil)
    config = config_file || @configFile
    "java -cp '#{PRINT_STANDALONE_JARS}' org.mapfish.print.cli.Main -config #{config} -verbose 0"
  end

  def print_standalone(print_params, temp_mapfish)
    require 'popen4'

    cmd = "#{baseCmd} -output #{temp_mapfish}"
    #result = ""
    errors = ""
    status = POpen4::popen4(cmd) do |stdout, stderr, stdin, pid|
      stdin.puts print_params.to_json
      stdin.close
      #result = stdout.readlines.join("")
      errors = stderr.readlines.join("")
    end
    if status.nil? || status.exitstatus != 0
      raise JavaError.new(cmd + "\n" + print_params.to_json, errors)
    end
  end

  # handler for sending custom report file, e.g. to customize filename depending on params
  # override in descendant classes
  def send_custom_report(report, print_params, path, type, filename)
    send_file path, :type => type, :disposition => 'attachment', :filename => filename
  end

  def cleanupTempFiles
    minTime = Time.now - TMP_PURGE_SECONDS;
    (OUTPUT_FORMATS + ["yml"]).each do |output_format|
      Dir.glob(TMP_PREFIX + "*." + output_format).each do |path|
        if File.mtime(path) < minTime
          File.delete(path)
        end
      end
    end
  end

  # convert Mapfish Print v2 request params to v3
  # NOTE: v2 can be used directly (with -v2), but does not support multiple maps
  # see also mapfish-print/core/src/main/java/org/mapfish/print/servlet/oldapi/OldAPIRequestConverter.java
  def convert_mapfish_v2_params(print_v2_params)
    print_params = {
      'attributes' => {}
    }

    # report (NOTE: keep dpi for possible image conversion)
    ['layout', 'outputFormat', 'dpi'].each do |k|
      print_params[k] = print_v2_params[k] if print_v2_params.has_key?(k)
    end

    # map
    map = {}
    map['dpi'] = print_v2_params['dpi'] if print_v2_params.has_key?('dpi')
    map['projection'] = print_v2_params['srs'] if print_v2_params.has_key?('srs')

    page_map_params = ['center', 'scale', 'rotation']
    print_v2_params['pages'].each do |page|
      if page.has_key?('center')
        map['center'] = page['center']
        # add text param for center
        print_params['attributes']['center_text'] = page['center']
      end
      if page.has_key?('scale')
        map['scale'] = page['scale']
        # add text param for scale
        print_params['attributes']['scale_text'] = page['scale']
      end
      map['rotation'] = -page['rotation'] if page.has_key?('rotation')

      # custom params from page
      page.each do |k, v|
        print_params['attributes'][k] = v unless page_map_params.include?(k)
      end
    end

    # layers
    map['layers'] = []
    if print_v2_params.has_key?('layers')
      print_v2_params['layers'].reverse.each do |v2_layer|
        layer = {}

        case v2_layer['type'].downcase
        when "wms"
          # WMS
          layer['type'] = 'wms'
          ['customParams', 'imageFormat', 'name', 'layers', 'opacity', 'mergeableParams', 'baseURL', 'styles', 'rasterStyle', 'failOnError', 'useNativeAngle', 'serverType', 'version'].each do |k|
            layer[k] = v2_layer[k] if v2_layer.has_key?(k)
          end
          layer['imageFormat'] = v2_layer['format'] if v2_layer.has_key?('format')
        when "vector"
          # vector
          layer['type'] = 'geojson'
          ['style', 'name', 'opacity', 'renderAsSvg', 'failOnError', 'geoJson'].each do |k|
            layer[k] = v2_layer[k] if v2_layer.has_key?(k)
          end
          if v2_layer.has_key?('styles')
            layer['style'] = v2_layer['styles']
            layer['style'].each do |k, v|
              if v.has_key?('label')
                # set default font
                v['fontFamily'] = 'sans-serif' unless v.has_key?('fontFamily')
                v['fontSize'] = '12px' unless v.has_key?('fontSize')
              end
            end
            layer['style']['styleProperty'] = v2_layer['styleProperty'] if v2_layer.has_key?('styleProperty')
            layer['style']['version'] = 1
          end
        else
          logger.info "Layer type not supported: #{v2_layer.to_yaml}"
          next
        end

        map['layers'] << layer
      end
    end

    print_params['attributes']['map'] = map

    # custom params
    non_custom_params = ['layout', 'outputFormat', 'units', 'srs', 'dpi', 'layers', 'pages']
    print_v2_params.each do |k, v|
      unless non_custom_params.include?(k)
        print_params['attributes'][k] = v
      end
    end

    print_params
  end

  # forward to JasperReport
  def create_report(report, request)
      call_params = {
        :j_username => JASPER_USER,
        :j_password => JASPER_PASSWORD
      }
      if request.parameters["pages"]
        page = request.parameters["pages"].first
        %w(scale rotation base_url user_title user_comment topics2print withlegend).each do |mfparam|
          call_params[mfparam.upcase] = page[mfparam]
        end
        call_params[:MAP_BBOX] = page["extent"].join(',')
        call_params[:MAP_CENTER] = page["center"].join(',')
        call_params[:MAP_SRS] = request.parameters["srs"]
      end
      request.parameters.each do |name, val|
        if name =~ /^REP_/
          call_params[name] = val
        end
      end
      pdfid = Time.now.strftime("%Y%m%d%H%M%S") + rand.to_s[2..4] 
      call_params['REP_PDFID'] = pdfid
      report_url = "#{JASPER_URL}/#{report}.pdf?#{ call_params.to_param }"

      begin
        logger.info "Forward request: #{report_url}"
        result = Net::HTTP.get_response(URI.parse(report_url))
        result["pdfid"] = pdfid
     rescue => err
        logger.info("#{err.class}: #{err.message}")
        return nil
      end
     result
  end

  #Mapfish print compatible report delivery
  def call_report(report, request)
      result = create_report(report, request)
      if result.nil?
        render :nothing => true, :status => 500
      elsif result.kind_of? Net::HTTPSuccess
        temp_id = SecureRandom.random_number(2**31)
        temp = TMP_PREFIX + temp_id.to_s + TMP_SUFFIX
        File.open(temp, 'wb') {|f| f.write(result.body) }

        # send link to print result
        render :json=>{ 'getURL' => url_for(:action=> 'show', :id=> temp_id) + ".pdf" }
      else
        logger.info "#{result.code}: #{result.body}"
        render :nothing => true, :status => result.code
      end
  end

  def create_and_send_jasper_report(report, request, type, filename)
    result = create_report(report, request)
    if result.nil?
      render :nothing => true, :status => 500
    elsif result.kind_of? Net::HTTPSuccess
      send_data result.body, :type => type, :disposition => 'attachment', :filename => filename
    else
      logger.info "#{result.code}: #{result.body}"
      render :nothing => true, :status => result.code
    end
  end

end
