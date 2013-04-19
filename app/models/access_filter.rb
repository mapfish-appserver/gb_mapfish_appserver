class AccessFilter < ActiveRecord::Base
  belongs_to :role

  attr_protected []

  scope :for_roles, lambda { |roles| where(:role_id => roles.collect(&:id)) }

end
