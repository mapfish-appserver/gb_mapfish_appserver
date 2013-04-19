class Wms
  include ActiveModel::Validations

  validates_presence_of :name

  attr_accessor :name

  def initialize(name)
    @name = name
  end
end
