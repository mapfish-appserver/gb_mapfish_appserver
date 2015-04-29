class UsersController < ApplicationController

  before_filter :authenticate_user!
  before_filter :accessible_user, :except => [:find]

  def show
  end

  def edit
  end

  def update
    unless params[:user][:app_infos].blank?
      @user.merge_app_infos(params[:user][:app_infos])
      params[:user].delete(:app_infos)
    end
    if @user.update_attributes(params[:user])
      redirect_to groups_users_url, :notice => 'Benutzer wurde erfolgreich gespeichert.'
    else
      render :action => "edit"
    end
  end

  # find users by email for autocomplete
  def find
    users = User.where("email ILIKE ?", "#{params[:term]}%").order(:email).pluck(:email)

    render :json => users
  end

  private

  # FIXME: use ability -> User.accessible_by(current_ability)
  def accessible_user
    @user = User.find(params[:id])

    user_accessible = (@user.id == current_user.id) # can edit self
    unless user_accessible
      # check if user is in accessible group
      groups = Group.accessible_by(current_ability)
      @user.groups_users.each do |groups_user|
        if groups.include?(groups_user.group)
          user_accessible = true
          break
        end
      end
    end
    unless user_accessible
      raise CanCan::AccessDenied.new("Permission error")
    end
  end

end
