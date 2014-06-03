#Mapfish print controller with access control and servlet call

class PrintController < ApplicationController
  require 'popen4'
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
      super(cmd+"\n"+message)
    end
  end

  def initialize
    @configFile = "#{Rails.root}/config/print.yml"
  end

  TMP_PREFIX = "#{PRINT_TMP_PATH}/mfPrintTempFile"
  TMP_SUFFIX = ".pdf"
  TMP_PURGE_SECONDS = 600

  OUTPUT_FORMATS = ["pdf", "png", "jpg", "tif", "gif"]

  def info
    #if PRINT_URL.present?
    #TODO:  call_servlet(request)
    cmd = baseCmd + " --clientConfig"
    result = ""
    errors = ""
    status = POpen4::popen4(cmd) do |stdout, stderr, stdin, pid|

      result = stdout.readlines.join("\n")
      errors = stderr.readlines.join("\n")
    end
    if status.nil? || status.exitstatus != 0
      raise JavaError.new(cmd, errors)
    else
      info = ActiveSupport::JSON.decode(result)
      info['createURL'] = url_for(:protocol => request.protocol, :action=>'create') + '.json'
      # add output formats
      info['outputFormats'] = []
      OUTPUT_FORMATS.each do |output_format|
        info['outputFormats'] << {:name => output_format}
      end

      respond_to do |format|
        format.json do
          if params[:var]
            render :text=>"var "+params[:var]+"="+result+";"
          else
            render :json=>info
          end
        end
      end
    end
  end

  def create
    cleanupTempFiles

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
          add_filter(topic, layer)

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

    scales = []
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
      # scale
      scales << page["scale"]
    end

    outputFormat = request.parameters["outputFormat"]
    request.parameters["outputFormat"] = 'pdf'

    logger.info request.parameters.to_yaml

    if request.parameters["report"]
      # JasperReport
      call_report(request)
    elsif PRINT_URL.present?
      # MapFish
      # FIXME: add custom scales to config file
      call_servlet(request)
    else
      # MapFish
      #print-standalone
      tempId = SecureRandom.random_number(2**31)

      # use temp config file with added custom scales
      print_config = File.read(@configFile)
      print_config.gsub!(/scales:/, "scales:\n#{ scales.collect {|s| "  - #{s.to_s}"}.join("\n") }")
      config_file = TMP_PREFIX + tempId.to_s + "print.yml"
      File.open(config_file, "w") { |file| file << print_config }

      temp = TMP_PREFIX + tempId.to_s + TMP_SUFFIX
      cmd = baseCmd(config_file) + " --output=" + temp
      result = ""
      errors = ""
      status = POpen4::popen4(cmd) do |stdout, stderr, stdin, pid|
        stdin.puts request.parameters.to_json
        #body = request.body
        #FileUtils.copy_stream(body, stdin)
        #body.close
        stdin.close
        result = stdout.readlines.join("\n")
        errors = stderr.readlines.join("\n")
      end
      if status.nil? || status.exitstatus != 0
        raise JavaError.new(cmd, errors)
      else
        convert_and_send_link(temp, tempId, request.parameters["dpi"], outputFormat)
      end
    end
  end

  def show
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
    end
    is_mapfish_print_id = (params[:id] =~ /^[0-9]+$/)
    if is_mapfish_print_id
      temp = TMP_PREFIX + params[:id] + ".#{output_format}"
      send_file temp, :type => type, :disposition => 'attachment', :filename => params[:id] + ".#{output_format}"
    else
      params['report'] = params[:id]
      result = create_report(request)
      if result.nil?
        render :nothing => true, :status => 500
        return
      end

      if result.kind_of? Net::HTTPSuccess
        send_data result.body, :type => type, :disposition => 'attachment', :filename => "#{params[:report]}.pdf"
      else
        logger.info "#{result.code}: #{result.body}"
        render :nothing => true, :status => result.code
      end
    end
  end

  def add_sld_body(topic, layer)
    # add SLD for selection
    unless layer["customParams"]["SELECTION[LAYER]"].blank?
      sld_body = Wms.sld_selection(topic,
        layer["customParams"]["SELECTION[LAYER]"],
        layer["customParams"]["SELECTION[PROPERTY]"],
        layer["customParams"]["SELECTION[VALUES]"].split(',')
      )

      unless sld_body.nil?
        # add serverside SLD for selection
        layer["customParams"]["SLD_BODY"] = sld_body
      else
        logger.info "Selection layer '#{layer["customParams"]["SELECTION[LAYER]"]}' not found in topic '#{topic.name}'"
      end

      # remove non-WMS params
      layer["customParams"].delete("SELECTION[LAYER]")
      layer["customParams"].delete("SELECTION[PROPERTY]")
      layer["customParams"].delete("SELECTION[VALUES]")
    end
  end

  def add_filter(topic, layer)
    filters = Wms.access_filters(current_ability, current_user, topic, layer["layers"])
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

  def baseCmd(config_file = nil)
    config = config_file || @configFile
    "java -cp #{GbMapfishPrint::PRINT_JAR} org.mapfish.print.ShellMapPrinter --config=#{config}"
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

  def call_servlet(request)
    url = URI.parse(URI.decode(PRINT_URL))
    logger.info "Forward request: #{PRINT_URL}"
    printspec = request.parameters.to_json

    response = nil
    begin
      http = Net::HTTP.new(url.host, url.port)
      http.start do
        case request.method.to_s
        when 'GET'  then response = http.get(url.path) #, request.headers
        #when 'POST' then response = http.post(url.path, printspec)
        when 'POST'  then response = http.get("#{url.path}?spec=#{CGI.escape(printspec)}") #-> GET print.pdf
        else
          raise Exception.new("unsupported method `#{request.method}'.")
        end
      end
    rescue => err
      logger.info("#{err.class}: #{err.message}")
      render :nothing => true, :status => 500
      return
    end
    #send_data response.body, :status => response.code, :type=>'application/x-pdf', :disposition=>'attachment', :filename=>'map.pdf'
    tempId = SecureRandom.random_number(2**31)
    temp = TMP_PREFIX + tempId.to_s + TMP_SUFFIX
    File.open(temp, 'w') {|f| f.write(response.body) }
    convert_and_send_link(temp, tempId, request.parameters["dpi"], request.parameters["outputFormat"])
  end

  # optionally convert PDF to image and send link to print result
  def convert_and_send_link(temp_pdf, temp_id, dpi, output_format)
    temp_suffix = ".pdf"

    if output_format != "pdf" && OUTPUT_FORMATS.include?(output_format)
        # convert PDF to image
        pdf = Magick::Image.read(temp_pdf) { self.density = dpi }.first
        temp_suffix = ".#{output_format}"
        temp_img = TMP_PREFIX + temp_id.to_s + temp_suffix
        pdf.write(temp_img)
        File.delete(temp_pdf)
    end

    respond_to do |format|
      format.json do
        render :json=>{ 'getURL' => url_for(:action=>'show', :id=>temp_id) + temp_suffix }
      end
    end
  end

  # forward to JasperReport
  def create_report(request)
      report = request.parameters["report"]
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
        result = Net::HTTP.get_response(URI.parse(URI.decode(report_url)))
        result["pdfid"] = pdfid
     rescue => err
        logger.info("#{err.class}: #{err.message}")
        return nil
      end
     result
  end

  #Mapfish print comaptible report delivery
  def call_report(request)
      result = create_report(request)
      if result.nil?
        render :nothing => true, :status => 500
        return
      end

      if result.kind_of? Net::HTTPSuccess
        temp_id = SecureRandom.random_number(2**31)
        temp = TMP_PREFIX + temp_id.to_s + TMP_SUFFIX
        File.open(temp, 'w') {|f| f.write(result.body) }

        render :json=>{ 'getURL' => url_for(:action=> 'show', :id=> temp_id) + ".pdf" }
      else
        logger.info "#{result.code}: #{result.body}"
        render :nothing => true, :status => result.code
      end
  end

end
