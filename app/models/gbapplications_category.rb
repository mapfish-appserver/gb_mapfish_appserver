class GbapplicationsCategory < ActiveRecord::Base
  belongs_to :gbapplication
  belongs_to :category

  attr_protected []
end
