class Attribute
  include ActiveModel::Validations

  validates_presence_of :layer, :name

  attr_accessor :layer, :name

  def initialize(layer, name)
    @layer, @name = layer, name
  end
end
