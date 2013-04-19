class RegistrationsController < Devise::RegistrationsController

  skip_before_filter :require_no_authentication #Devise bug?
  layout :application_layout

  def index
  end

  def new
    @group = Group.find_by_name(params[:group])
    super
  end

  def create
    @group = Group.find(params[:user][:requested_group]) if params[:user][:requested_group] 
    super
    unless @user.new_record?
      Registrations.group_user_registration_email(
        @group, @user, edit_groups_user_url(@user.groups_users.last)
      ).deliver
    end
  end

  def update
    super
  end

  def login
    # redirected to here after AJAX login
    if user_signed_in?
      render :json => {
        :success => true,
        :user => { :login => current_user.login, :email => current_user.email},
        :roles => current_roles.roles.collect(&:name)
      }
    else
      render :json => {
        :success => false, :user => {}, :roles => []
      }
    end
  end

  def logout
    render :nothing => true
  end

  private

  def after_sign_up_path_for(resource)
    user_welcome_path
  end

  def application_layout
    params[:layout] || "application"
  end
end