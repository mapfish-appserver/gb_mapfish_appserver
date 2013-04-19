class Gbapplication < ActiveRecord::Base
  has_many :gbapplications_categories
  has_many :categories, :through => :gbapplications_categories, :order => "gbapplications_categories.sort"

  attr_protected []

  validates :name, :presence => true, :uniqueness => true
end
