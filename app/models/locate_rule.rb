class LocateRule
  attr_accessor :model, :layer, :search_field

  def initialize(model, layer=nil, search_field=nil)
    @model = model.constantize
    @layer = layer
    @search_field = search_field
  end

  # get selection and extent for located features
  def locate(locations, client_srid=nil)
    features = if layer.nil?
      # user defined model
      seltopic = model.selection_topic
      sellayer = model.selection_layer
      selproperty = model.primary_key
      selscalerange = model.selection_scalerange
      search_locs = model.search_locations(locations)
      model.locate(search_locs, client_srid)
    else
      # generic SearchModel
      layer_obj = Layer.find_by_name(layer)
      seltopic = nil
      sellayer = layer_obj.name
      selproperty = layer_obj.feature_class.primary_key
      selscalerange = model.selection_scalerange
      search_locs = locations.split(',')
      model.layer_locate(layer_obj, search_field, search_locs, client_srid)
    end
    if features.present?
      x, y, scale = model.map_center(features)
      {
        :selection => {
          :topic => seltopic,
          :layer => sellayer,
          :property => selproperty,
          :values => features.collect {|f| f.send(model.primary_key) },
          :scalerange => selscalerange,
        },
        :x => x,
        :y => y,
        :scale => scale,
        :bbox => model.bbox(features)
      }
    else
      # no features found
      nil
    end
  end
end
