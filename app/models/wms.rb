class Wms
  include ActiveModel::Validations

  validates_presence_of :name

  attr_accessor :name

  def initialize(name)
    @name = name
  end

  def self.access_filters(ability, user, topic_name, layers)
    access_filters = {}
    unless topic_name.blank?
      layers.each do |layer|
        access_filter = ability.access_filter("WMS", topic_name, layer)
        unless access_filter.nil?
          access_filter.each do |key, value|
            access_filter[key] = AccessFilter.user_value(user, value)
          end
          access_filters.merge!(access_filter)
        end
      end
    end
    access_filters
  end

end
