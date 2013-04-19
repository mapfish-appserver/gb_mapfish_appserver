class ApplicationController < ActionController::Base
  #protect_from_forgery #TODO: CRSF protection not implemented in Login dialog

  #check_authorization

  before_filter :set_zone
  before_filter :set_locale

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
    @current_roles ||= Ability::Roles.new(current_user, host_zone(request.host))
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
    if request.xhr? || host_zone(request.host) == SITE_DEFAULT #Workaround for internet behaviour
      user_login_path
    else
      stored_location_for(resource) || root_path
    end
  end

  def after_sign_out_path_for(resource)
    if request.xhr?
      user_logout_path
    else
      stored_location_for(resource) || root_path
    end
  end

end
