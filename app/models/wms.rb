class Wms
  include ActiveModel::Validations

  validates_presence_of :name

  attr_accessor :name

  def initialize(name)
    @name = name
  end

  # return SLD for selection
  def self.sld_selection(layer, filter_property, filter_values)
    sld = '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" version="1.0.0" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">'
    sld <<  "<NamedLayer>"
    sld <<    "<Name>#{layer.name}</Name>"
    sld <<    "<UserStyle>"
    sld <<      "<Name>default</Name>"
    sld <<      "<FeatureTypeStyle>"
    sld <<        "<Rule>"
    sld <<          "<Name>show-selection</Name>"
    sld <<          '<ogc:Filter>'
    sld <<            '<ogc:Or>' if filter_values.size > 1
    filter_values.each do |value|
      sld <<          "<ogc:PropertyIsEqualTo>"
      sld <<            "<ogc:PropertyName>#{filter_property}</ogc:PropertyName>"
      sld <<            "<ogc:Literal>#{value}</ogc:Literal>"
      sld <<          "</ogc:PropertyIsEqualTo>"
    end
    sld <<          '</ogc:Or>' if filter_values.size > 1
    sld <<          "</ogc:Filter>"
    sld << layer.selection_symbolizer
    sld <<          "<MinScaleDenominator>0</MinScaleDenominator>"
    sld <<          "<MaxScaleDenominator>999999999</MaxScaleDenominator>"
    sld <<        "</Rule>"
    sld <<      "</FeatureTypeStyle>"
    sld <<    "</UserStyle>"
    sld <<  "</NamedLayer>"
    sld << "</StyledLayerDescriptor>"

    sld
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
