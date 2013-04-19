class GroupsUser < ActiveRecord::Base
  belongs_to :group
  belongs_to :user

  attr_protected []
end
