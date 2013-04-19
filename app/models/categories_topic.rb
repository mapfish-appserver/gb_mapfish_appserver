class CategoriesTopic < ActiveRecord::Base
  belongs_to :category
  belongs_to :topic

  attr_protected []
end
