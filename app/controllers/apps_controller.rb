class AppsController < ApplicationController

  before_filter :redirect_to_https_if_signed_in

  def show
    @current_roles = current_roles.roles.collect(&:name)

    @topic_name = params['topic'] || DEFAULT_TOPIC[@zone].name

    @back_topic_name = params['back'].nil? ? nil : params['back']
    @over_topic_name = params['over'].blank? ? '[]' : params['over'].split(',').to_json

    @main_default_topic = DEFAULT_TOPIC[@zone].name
    @offlayers = params['offlayers'].blank? ? [] : params['offlayers'].split(',')

    @scale = params['scale'].nil? ? DEFAULT_SCALE : params['scale'].to_i
    @x = params['x'].nil? ? DEFAULT_X : params['x'].to_f
    @y = params['y'].nil? ? DEFAULT_Y : params['y'].to_f

    @zoom = params['zoom'].nil? ? DEFAULT_ZOOM : params['zoom'].to_i # for mobile
    @gbapp = params['gbapp'].nil? ? 'default' : params['gbapp'] # for mobile

    @seltopic = params['seltopic']
    @sellayer = params['sellayer']
    @selproperty = params['selproperty']
    @selvalues = params['selvalues'].nil? ? [] : params['selvalues'].split('$')

    @filt_topic = params['filttopic']
    @filt_param = params['filtparam']
    @filt_values = params['filtvalues'].nil? ? [] : params['filtvalues'].split('$')
    @filt_typestring = params['filttypestring'].nil? ? 0 : params['filttypestring']

    @redlining = params['redlining'].blank? ? nil : params['redlining']
    @centermarker = params['centermarker']

    @markers = params['markers']

    if params['locate']
      rule = LOCATERULES[params['locate']]
      if rule.nil?
        logger.info "Locate rule not found: {params['locate']}"
      else
        location = rule.locate(params['locations'])
        unless location.nil?
          @seltopic = location[:selection][:topic] || @topic_name
          @sellayer = location[:selection][:layer]
          @selproperty = location[:selection][:property]
          @selvalues = location[:selection][:values]
          @selscalerange = location[:selection][:scalerange]
          @x = location[:x]
          @y = location[:y]
          @scale = params['scale'].nil? ? location[:scale] : params['scale'].to_i
          @selbbox = location[:bbox]
        else
          logger.info "no features found."
        end
      end
    end

    @selection_valid = !(@seltopic.nil? || @sellayer.nil? || @selproperty.nil? || @selvalues.empty?)
    @app = params[:app]

    session[:map_ts] = Time.now # Used for checking access to non-public WMS

    render :action => @app, :layout => false
  end

  private

  def redirect_to_https_if_signed_in
    if REDIRECT_APP_TO_HTTPS_IF_SIGNED_IN && user_signed_in?
      # redirect to HTTPS if user is logged in
      unless request.ssl?
        redirect_to params.merge({:protocol => 'https://'}), :status => :temporary_redirect
      end
    end
  end

end
