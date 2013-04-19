class TopicsController < ApplicationController

  #cache topics.json
  caches_action :index, :cache_path => Proc.new {
    {:ssl => request.ssl?, :app => params[:gbapp], :roles => current_roles.roles}
  }

  def index
    params[:gbapp] = 'gbzh' if params[:gbapp] == 'default' #FIXME
    @app = Gbapplication.find_by_name(params[:gbapp]) if params[:gbapp]

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
    @query_topics = ActiveSupport::JSON.decode(params[:infoQuery])['queryTopics']
    #e.g. [{"layers"=>"lk25,grenzen,gemeindegrenzen,seen,wald,haltestellen", "divCls"=>"legmain", "level"=>"main", "topic"=>"BASISKARTEZH"}, {"layers"=>"", "divCls"=>"legover", "level"=>"over", "topic"=>"AVParzOverlayZH"}]
    @query_topics.each do |query_topic|
      topic = Topic.where(:name => query_topic['topic']).first
      authorize! :show, topic
      query_topic['topicobj'] = topic
      query_topic['results'] = topic.query(current_ability, query_topic, params['bbox'])
    end
    render :layout => false
  end

  def legend
    #TODO: -> show?mode=legend
    @topic = Topic.includes(:layers).where(:name => params[:id]).first
    @topic ||= Topic.includes(:layers).find(params[:id])
    authorize! :show, @topic
    render :layout => false
  end

end
