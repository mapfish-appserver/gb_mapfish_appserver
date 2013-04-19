class Organisation < ActiveRecord::Base
  has_many :topics

  attr_protected []

  validates :title, :presence => true, :uniqueness => true

  def name # for RailsAdmin
    title
  end
end
