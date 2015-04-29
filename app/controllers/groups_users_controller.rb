# encoding: UTF-8
class GroupsUsersController < ApplicationController
  #authorize_resource
  before_filter :authenticate_user!
  before_filter :accessible_groups

  # GET /groups_users
  # GET /groups_users.json
  def index
    @groups = admin_groups(@groups)
    @groups_users = GroupsUser.where(:group_id => @groups).joins(:group, :user).order('groups.name,users.login')
    respond_to do |format|
      format.html # index.html.erb
      format.json { render :json => @groups_users }
    end
  end

  # GET /groups_users/1
  # GET /groups_users/1.json
  def show
    @groups = admin_groups(@groups)
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render :json => @groups_user }
    end
  end

  # GET /groups_users/new
  # GET /groups_users/new.json
  def new
    @group = @groups.find(params[:group])
    raise CanCan::AccessDenied.new("Permission error") unless current_user.group_admin?(@group)
    @groups_user = GroupsUser.new(:group => @group)

    respond_to do |format|
      format.html # new.html.erb
      format.json { render :json => @groups_user }
    end
  rescue
    raise CanCan::AccessDenied.new("Permission error")
  end

  # GET /groups_users/1/edit
  def edit
    @groups = admin_groups(@groups)
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])
    @mail_body = mail_body
  rescue
    raise CanCan::AccessDenied.new("Permission error")
  end

  # POST /groups_users
  # POST /groups_users.json
  def create
    @group = @groups.find(params[:groups_user][:group_id])
    raise CanCan::AccessDenied.new("Permission error") unless current_user.group_admin?(@group)
    @groups_user = GroupsUser.new(params[:groups_user])

    user = User.find_by_email(params[:user_email])
    if user.nil?
      flash[:error] = "Kein Benutzer mit dieser E-Mail gefunden"
      render :action => "new"
      return
    elsif @group.groups_users.where("groups_users.user_id = ?", user.id).any?
      flash[:error] = "Benutzer gehört schon zu dieser Gruppe"
      render :action => "new"
      return
    end

    @groups_user.user = user
    @groups_user.granted = true

    respond_to do |format|
      if @groups_user.save
        format.html { redirect_to groups_users_url, :notice => 'Benutzer wurde erfolgreich zur Gruppe hinzugefügt.' }
        format.json { render :json => @groups_user, :status => :created, :location => @groups_user }
      else
        format.html { render :action => "new" }
        format.json { render :json => @groups_user.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /groups_users/1
  # PUT /groups_users/1.json
  def update
    @groups = admin_groups(@groups)
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
    @groups = admin_groups(@groups)
    @groups_user = GroupsUser.where(:group_id => @groups).find(params[:id])
    @groups_user.destroy

    respond_to do |format|
      format.html { redirect_to groups_users_url }
      format.json { head :ok }
    end
  end

  # registration of existing user from signup page
  def register
    @group = Group.find(params[:group][:requested_group]) if params[:group][:requested_group]
    @groups_user = GroupsUser.where(:group_id => @group.id, :user_id => current_user.id).first_or_create

    unless params[:group][:app_infos].blank?
      # merge non-empty app_infos
      new_app_infos = params[:group][:app_infos].reject {|key, value| value.blank? }
      current_user.merge_app_infos(new_app_infos)
    end

    # send mail to group admins
    Registrations.group_user_registration_email(
      @group, current_user, edit_groups_user_url(@groups_user)
    ).deliver

    redirect_to user_confirm_path
  end

  # show and manage users for a group
  def show_group
    @group = @groups.find(params[:group])
    @groups_users = GroupsUser.where(:group_id => @group).joins(:group, :user).order('groups.name,users.login')
  end

  private

  def accessible_groups
    @groups = Group.accessible_by(current_ability).order(:name)
  end

  # return groups where user is admin
  def admin_groups(groups)
    groups.reject {|g| !current_user.group_admin?(g)}
  end

  def mail_body
    mail_body_file = File.join(Rails.root, 'app', 'views', 'groups_users', 'mails', "_#{@groups_user.group.name}.html.erb")
    if File.exist?(mail_body_file)
      "groups_users/mails/#{@groups_user.group.name}"
    else
      'groups_users/mails/default'
    end
  end

end
