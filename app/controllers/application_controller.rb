class ApplicationController < ActionController::Base
  #protect_from_forgery #TODO: CRSF protection not implemented in Login dialog

  #check_authorization

  before_filter :set_zone
  before_filter :set_locale

  # This is our new function that comes before Devise's one
  before_filter :authenticate_user_from_token!
  # This is Devise's authentication
  # before_filter :authenticate_user!

  protected

  #Zone 'intranet' or 'internet' depending on host name
  def host_zone(hostname)
    HOST_ZONE[hostname]
  end

  def wms_host
    "#{request.protocol}#{request.host_with_port}/wms"
  end

  def set_locale
    default_locale = rails_admin_controller? ? 'en' : I18n.default_locale 
    I18n.locale = params[:lang] || default_locale
  end

  def rails_admin_controller?
    false
  end

  private

  rescue_from CanCan::AccessDenied do |exception|
    sign_out
    redirect_to new_user_session_url, :alert => exception.message
  end

  def set_zone
    @zone = host_zone(request.host)
  end

  def current_roles
    @current_roles_ ||= Ability::Roles.new(current_user, host_zone(request.host))
  end

  # Overide CanCan method
  def current_ability
    @current_ability ||= Ability.new(current_roles)
  end

  def log_user_permissions(action, resource)
    current_ability.user_permissions(action, resource).each do |p|
      logger.info p.name
    end
  rescue
    logger.info "log_user_permissions exception. action: '#{action}' resource: '#{resource}'"
  end

  def after_sign_in_path_for(resource)
    if request.xhr?
      # logged in via AJAX
      user_login_path
    else
      stored_location_for(resource) || user_path(current_user)
    end
  end

  def after_sign_out_path_for(resource)
    if request.xhr?
      # logged out via AJAX
      user_logout_path
    else
      stored_location_for(resource) || new_user_session_path
    end
  end

# With a token setup, all you need to do is override
# your application controller to also consider token
# lookups:

  
  # We are using token authentication
  # via parameters. However, anyone could use Rails's token
  # authentication features to get the token from a header.
  def authenticate_user_from_token!
    user_token = params[:USER_TOKEN].presence
    user       = user_token && User.find_by_authentication_token(user_token.to_s)

   if user
      # Notice when passing store false, the user is not
      # actually stored in the session and a token is needed
      # for every request. If you want the token to work as a
      # sign in token, you can simply remove store: false.
      sign_in user, :store => true
    end
  end

end
