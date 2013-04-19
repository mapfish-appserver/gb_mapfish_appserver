class LayersController < ApplicationController

  #cache layers.json
  caches_action :index, :cache_path => Proc.new {
    {:topic => params[:topic], :roles => current_roles.roles}
  }

  def index
    respond_to do |format|
      format.json { render :json => Layer.list(current_ability, params[:layer_type], params[:topic]) }
    end
  end
end
