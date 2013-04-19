class SublayerGroup < ActiveRecord::Base
  has_many :layers

  attr_protected []

  scope :unused, includes(:layers).where('layers.sublayer_group_id IS NULL')
end
