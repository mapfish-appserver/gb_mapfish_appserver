class Group < ActiveRecord::Base
  has_and_belongs_to_many :roles
  has_many :groups_users
  has_many :users, :through => :groups_users, :conditions => ["groups_users.granted = true"]

  attr_protected []

  def admins
    users = []
    perms = Permission.where(:resource_type => 'Group', :resource => name, :action => 'edit').includes(:role => :users)
    perms.each { |p| users += p.role.users }
    users
  end
end
