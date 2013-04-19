class Registrations < ActionMailer::Base
  default :from => "arv.gis@bd.zh.ch"

  def group_user_registration_email(group, user, edit_groups_user_url)
    @group = group
    @user = user
    @url  = edit_groups_user_url
    admins = group.admins.collect(&:email)
    mail(:to => admins, :subject => "GIS-Browser: User Registrierung")
  end
end
