class AppsController < ApplicationController

  def show
    logger.debug "Site: '#{@zone}'"
    @topic_name = params['topic'] || DEFAULT_TOPIC[@zone].name
    @main_default_topic = DEFAULT_TOPIC[@zone].name
    @offlayers = params['offlayers'].blank? ? [] : params['offlayers'].split(',')

    @scale = params['scale'].nil? ? DEFAULT_SCALE : params['scale'].to_i
    @x = params['x'].nil? ? DEFAULT_X : params['x'].to_f
    @y = params['y'].nil? ? DEFAULT_Y : params['y'].to_f

    @seltopic = params['seltopic']
    @sellayer = params['sellayer']
    @selproperty = params['selproperty']
    @selvalues = params['selvalues'].nil? ? [] : params['selvalues'].split('$')

    @redlining = params['redlining'].blank? ? nil : params['redlining']

    if params['locate']
      rule = LOCATERULES[params['locate']]
      if rule.nil?
        logger.info "Locate rule not found: {params['locate']}"
      else
        model = rule.model.constantize
        features = if rule.layer.nil?
          @seltopic = model.selection_topic
          @sellayer = model.selection_layer
          @selproperty = model.primary_key
          search_locs = model.search_locations(params['locations'])
          model.locate(search_locs)
        else
          layer = Layer.find_by_name(rule.layer)
          @seltopic = @topic_name
          @sellayer = layer.name
          @selproperty = layer.feature_class.primary_key
          search_locs = params['locations'].split(',')
          model.layer_locate(layer, rule.search_field, search_locs)
        end
        if features.present?
          @x, @y, scale = model.map_center(features)
          @scale = params['scale'].nil? ? scale : params['scale'].to_i
          #Selection
          @selbbox = model.bbox(features)
          @selvalues = features.collect {|f| f.send(model.primary_key) }
        end
      end
    end

    @selection_valid = !(@seltopic.nil? || @sellayer.nil? || @selproperty.nil? || @selvalues.empty?)
    @app = params[:app]

    session[:map_ts] = Time.now # Used for checking access to non-public WMS

    render :action => @app, :layout => false
  end

end
