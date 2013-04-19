class TopicsLayer < ActiveRecord::Base
  belongs_to :topic
  belongs_to :layer

  attr_protected []

  # For RailsAdmin form
  def name
    layer.name
  end
end
