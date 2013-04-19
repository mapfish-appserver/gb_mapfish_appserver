class GroupsUsersController < ApplicationController
  #authorize_resource
  before_filter :accessible_groups

  # GET /groups_users
  # GET /groups_users.json
  def index
    @groups_users = GroupsUser.where(:group_id => @groups)
    respond_to do |format|
      format.html # index.html.erb
      format.json { render :json => @groups_users }
    end
  end

  # GET /groups_users/1
  # GET /groups_users/1.json
  def show
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render :json => @groups_user }
    end
  end

  # GET /groups_users/new
  # GET /groups_users/new.json
  def new
    @groups_user = GroupsUser.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render :json => @groups_user }
    end
  rescue
    raise CanCan::AccessDenied.new("Permission error")
  end

  # GET /groups_users/1/edit
  def edit
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])
  rescue
    raise CanCan::AccessDenied.new("Permission error")
  end

  # POST /groups_users
  # POST /groups_users.json
  def create
    #@groups_user = GroupsUser.new(params[:groups_user])
    #
    #respond_to do |format|
    #  if @groups_user.save
    #    format.html { redirect_to groups_users_url, :notice => 'Groups user was successfully created.' }
    #    format.json { render :json => @groups_user, :status => :created, :location => @groups_user }
    #  else
    #    format.html { render :action => "new" }
    #    format.json { render :json => @groups_user.errors, :status => :unprocessable_entity }
    #  end
    #end
  end

  # PUT /groups_users/1
  # PUT /groups_users/1.json
  def update
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])

    respond_to do |format|
      if @groups_user.update_attributes(params[:groups_user])
        format.html { redirect_to groups_users_url, :notice => 'Groups user was successfully updated.' }
        format.json { head :ok }
      else
        format.html { render :action => "edit" }
        format.json { render :json => @groups_user.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /groups_users/1
  # DELETE /groups_users/1.json
  def destroy
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])
    @groups_user.destroy

    respond_to do |format|
      format.html { redirect_to groups_users_url }
      format.json { head :ok }
    end
  end

  private

  def accessible_groups
    @groups = Group.accessible_by(current_ability)
  end

end
