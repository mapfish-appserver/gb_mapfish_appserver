class Category < ActiveRecord::Base
  has_many :categories_topics
  has_many :topics, :through => :categories_topics, :order => "categories_topics.sort DESC"

  attr_protected []

  validates :title, :presence => true, :uniqueness => true

  def name # for RailsAdmin
    title
  end
end
