class AppsController < ApplicationController

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

    @redlining = params['redlining'].blank? ? nil : params['redlining']
    @centermarker = params['centermarker']

    @markers = params['markers']

    if params['locate']
      rule = LOCATERULES[params['locate']]
      if rule.nil?
        logger.info "Locate rule not found: {params['locate']}"
      else
        model = rule.model.constantize
        features = if rule.layer.nil?
          #User defined model
          @seltopic = model.selection_topic
          @sellayer = model.selection_layer
          @selproperty = model.primary_key
          @selscalerange = model.selection_scalerange
          search_locs = model.search_locations(params['locations'])
          model.locate(search_locs)
        else
          #Generic SearchModel
          layer = Layer.find_by_name(rule.layer)
          @seltopic = @topic_name
          @sellayer = layer.name
          @selproperty = layer.feature_class.primary_key
          @selscalerange = model.selection_scalerange
          search_locs = params['locations'].split(',')
          model.layer_locate(layer, rule.search_field, search_locs)
        end
        if features.present?
          @x, @y, scale = model.map_center(features)
          @scale = params['scale'].nil? ? scale : params['scale'].to_i
          #Selection
          @selbbox = model.bbox(features)
          @selvalues = features.collect {|f| f.send(model.primary_key) }
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

end
