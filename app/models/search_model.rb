class SearchModel < GeoModel

  LOCATE_MAX_COUNT = 50

  self.abstract_class = true

  def self.query(fields, params)
    #return {:features => [], :quality => n}
    raise NotImplementedError.new
  end

  def self.locate(locations)
    #return {:features => []}
    raise NotImplementedError.new
  end

  def self.selection_topic
    nil
  end

  def self.selection_layer
    nil
  end

  def self.selection_scalerange
    nil
  end

  #Generic location search with one search field
  def self.layer_locate(layer, search_field, locations)
    feature_class = layer.feature_class
    feature_class.where(search_field => locations).select(feature_class.primary_key).select(feature_class.extent_field).limit(LOCATE_MAX_COUNT).all
  end

  # "261,AU4998$261,AU4999" -> [["261","AU4998"],["261","AU4999"]]
  # TODO: inconsistent with single field search -> "261|AU4998,261|AU4999" -> [["261","AU4998"],["261","AU4999"]]
  def self.search_locations(param)
    locations = param.split('$')
    locations.collect {|l| l.split(',') }
  end

  def self.soap_query(fields, soap_params, soap_action)
    #return {:feature => f, :hits => n, :quality => n, :template => str}
    #return {:features => [], :template => str}
    #return {:error => str}
    raise NotImplementedError.new
  end

  # calculate envelope of all features
  def self.envelope(features)
    unless features.empty?
      envelope = GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(features.first['extent']).envelope
      features.each do |feature|
        next if feature == features.first
        envelope.extend!(GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(feature['extent']).envelope)
      end
      envelope
    end
  end

  # calculate bbox of all features
  def self.bbox(features)
    envelope = envelope(features)
    [envelope.lower_corner.x, envelope.lower_corner.y, envelope.upper_corner.x, envelope.upper_corner.y]
  end

  # calculate center and scale for feature locations
  def self.map_center(features)
    env = envelope(features)
    scale = 500 #FIXME: use self.bbox instead of map_center 
    [env.center.x, env.center.y, scale]
  end

end
