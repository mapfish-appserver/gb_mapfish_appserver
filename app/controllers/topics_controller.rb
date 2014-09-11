class TopicsController < ApplicationController

  #cache topics.json
  caches_action :index, :cache_path => Proc.new {
    {:ssl => request.ssl?, :app => params[:gbapp], :roles => current_roles.roles}
  }

  def index
    @app = Gbapplication.find_by_name(params[:gbapp]) if params[:gbapp]
    if @app.nil?
      logger.error "Gbapplication '#{params[:gbapp]}' not found"
      head :bad_request
      return
    end

    respond_to do |format|
      format.json do
        render :json => Topic.list(@app, current_ability, host_zone(request.host), wms_host)
      end
    end
  end

  def show #TODO: obsolete?
    @topic = Topic.includes(:layers).find(params[:id])

    respond_to do |format|
      format.json do
        render :json => @topic.to_json(:include => :layers)
      end
    end
  end

  def query
    # optional parameter (default = false) to return only the feature nearest to the center of the search geometry, if no custom layer query is used
    nearest = params['nearest'] == 'true'

    @query_topics = ActiveSupport::JSON.decode(params[:infoQuery])['queryTopics']
    #e.g. [{"layers"=>"lk25,grenzen,gemeindegrenzen,seen,wald,haltestellen", "divCls"=>"legmain", "level"=>"main", "topic"=>"BASISKARTEZH"}, {"layers"=>"", "divCls"=>"legover", "level"=>"over", "topic"=>"AVParzOverlayZH"}]
    @query_topics.each do |query_topic|
      topic = Topic.where(:name => query_topic['topic']).first
      authorize! :show, topic
      query_topic['topicobj'] = topic
      if params['bbox']
        query_topic['results'] = topic.query(current_ability, query_topic, params['bbox'], nearest)
      elsif params['rect']
        x1, y1, x2, y2 = params['rect'].split(',').collect(&:to_f)
        rect = "POLYGON((#{x1} #{y1}, #{x1} #{y2}, #{x2} #{y2}, #{x2} #{y1} ,#{x1} #{y1}))"
        query_topic['results'] = topic.query(current_ability, query_topic, rect, nearest)
      elsif params['circle']
        query_topic['results'] = topic.query(current_ability, query_topic, params['circle'], nearest)
      elsif params['poly']
        query_topic['results'] = topic.query(current_ability, query_topic, params['poly'], nearest)
      else
        # problem
      end
    end
    if params['bbox']
      x1, y1, x2, y2 = (params['bbox']).split(',').collect(&:to_f)
      @xx = (x1 + x2) / 2.0
      @yy = (y1 + y2) / 2.0
      @height = 0 #Dtm.getHeight(params['bbox'])
    else
      @xx = 0
      @yy = 0
      @height = 0
    end

    respond_to do |format|
      format.html { render :layout => false }

      format.json do
         render :json => prepJson
      end
      format.jsonp do
        render :json => prepJson, :callback => params[:callback]
      end
    end
  end

  def prepJson
    query_results = {}
    @query_topics.each do |query_topic|
      layer_results = {}
      query_topic['results'].each do |result|
        layer_results[result[0][:name]] = result
      end
      query_results[query_topic['topicobj'].name] = layer_results
    end

    {  
      :results => query_results,
      :height => @height,
      :x => @xx,
      :y => @yy
    }.to_json

  end

  def legend
    #TODO: -> show?mode=legend
    @topic = Topic.includes(:layers).where(:name => params[:id]).first
    @topic ||= Topic.includes(:layers).find(params[:id])
    authorize! :show, @topic
    render :layout => false
  end

end
