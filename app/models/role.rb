class Role < ActiveRecord::Base
  has_and_belongs_to_many :users
  has_and_belongs_to_many :groups
  has_many :permissions, :order => 'sequence', :dependent => :destroy
  has_many :access_filters, :dependent => :destroy

  attr_protected []
end
