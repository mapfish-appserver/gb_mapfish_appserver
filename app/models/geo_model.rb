class GeoModel < ActiveRecord::Base
  establish_connection(GEODB)

  self.abstract_class = true

  attr_protected []

  def self.geometry_column_info
    #spatial_column_info returns key/value list with geometry_column name as key
    #value example: {:srid=>21781, :type=>"MULTIPOLYGON", :dimension=>2, :has_z=>false, :has_m=>false, :name=>"the_geom"}
    #We take the first matching entry
    @geometry_column_info ||= connection.spatial_column_info(table_name).values.first
  end

  def self.geometry_column_name
    geometry_column_info[:name]
  end

  def self.geometry_type
    geometry_column_info[:type]
  end

  def self.srid
    geometry_column_info[:srid]
  end

  def self.geometry_column
    col = columns_hash[geometry_column_name]
    col.instance_eval { @srid = srid }
    col
  end

  def self.extent_field
    "ST_Envelope(#{table_name}.#{geometry_column_name}) AS extent"
  end

  def self.area_field
    "ST_Area(#{table_name}.#{geometry_column.name}) AS area"
  end

  def self.identify_filter(searchgeo, radius, nearest=false)
    filter = scoped
    if searchgeo[0..3] == "POLY"
      logger.debug "*** POLY-query: #{searchgeo} ***"
      polygon = "ST_GeomFromText('#{searchgeo}', #{srid})"
      filter = filter.where("ST_DWithin(#{table_name}.#{geometry_column_name}, #{polygon}, #{radius})")
      center = "ST_Centroid(#{polygon})"
    else
      if searchgeo.split(',').length == 3
        logger.debug "*** CIRCLE-query: #{searchgeo} ***"
        x1, y1, r  = searchgeo.split(',').collect(&:to_f)
        center = "ST_GeomFromText('POINT(#{x1} #{y1})', #{srid})"
        filter = filter.where("ST_DWithin(#{table_name}.#{geometry_column_name}, #{center}, #{r})")
      else
        logger.debug "*** BBOX-query: #{searchgeo} ***"
        x1, y1, x2, y2 = searchgeo.split(',').collect(&:to_f)
        center = "ST_GeomFromText('POINT(#{x1+(x2-x1)/2} #{y1+(y2-y1)/2})', #{srid})"
        filter = filter.where("ST_DWithin(#{table_name}.#{geometry_column_name}, #{center}, #{radius})")
      end
    end

    if nearest
      logger.debug "*** query nearest ***"
      min_dist = filter.select("Min(ST_Distance(#{table_name}.#{geometry_column_name}, #{center})) AS min_dist").first
      unless min_dist.nil?
        logger.debug "*** min_dist = #{min_dist.min_dist} ***"
        if min_dist.min_dist.to_f == 0
          # center of the search geometry is within a feature (may be overlapping features)
          filter = filter.where("ST_Within(#{center}, #{table_name}.#{geometry_column_name})")
        else
          # get the feature nearest to the center of the search geometry
          filter = filter.order("ST_Distance(#{table_name}.#{geometry_column_name}, #{center})").limit(1)
        end
      end
      # else no features in filter
    end

    filter
  end

  #Custom identify query
  #def self.identify_query(bbox, radius)
  #  scoped.select().where()....
  #end

  def bbox
    envelope = GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(extent).envelope #TODO: replace with rgeo
    [envelope.lower_corner.x, envelope.lower_corner.y, envelope.upper_corner.x, envelope.upper_corner.y]
  end

  # based on mapfish_filter
  def self.bbox_filter(params)
    filter = scoped

    if params['bbox']
      x1, y1, x2, y2 = params['bbox'].split(',').collect(&:to_f)
      box = [[x1, y1], [x2, y2]]
      filter_geom = "'BOX3D(#{box[0].join(" ")},#{box[1].join(" ")})'::box3d"
    elsif params['polygon']
      filter_geom = "ST_GeomFromText('#{params['polygon']}')"
    end

    if filter_geom
      filter = filter.where("ST_Intersects(#{table_name}.#{connection.quote_column_name(geometry_column_name)}, ST_SetSRID(#{filter_geom}, #{srid}))")
    end

    filter.limit(1000)
  end

  def self.geojson_decode(json)
    RGeo::GeoJSON.decode(json, :json_parser => :json, :geo_factory => geo_factory)
  end

  def to_geojson(options = {})
    only = options.delete(:only)
    geoson = { :type => 'Feature' }
    geoson[:properties] = attributes.delete_if do |name, value|
      # TODO: support for multiple geometry columns
      if name == self.class.geometry_column_name
        geoson[:geometry] = value
        true
      elsif name == self.class.primary_key then
        geoson[:id] = value
        true
      elsif only
        !only.include?(name.to_sym)
      end
    end
    geoson.to_json
  end

  def update_attributes_from_geojson_feature(feature, user)
    attr = feature.properties
    attr[self.class.geometry_column_name] = feature.geometry unless feature.geometry.nil?
    ok = update_attributes(attr)
    modified_by(user)
    ok
  end

  # update modification attributes (changed_by, etc.)
  # Override in descendant classes
  def modified_by(user)
    #none by default
  end

  def self.can_edit?(ability)
    @@layers ||= Layer.where(:table => self.table_name).all
    can_edit = false
    @@layers.each do |layer|
      # check if any layer with this table is editable
      if ability.can?(:edit, layer)
        can_edit = true
        break
      end
    end
    can_edit
  end

  # apply user filter for editing
  # Override in descendant classes
  def self.user_filter(ability)
    if ability.nil?
      forbidden(ability)
    elsif can_edit?(ability)
      scoped #No filter
    else
      forbidden(ability)
    end
  end

  def self.forbidden(ability)
    if ability.nil?
      logger.info "----> Edit access forbidden without login"
    else
      logger.info "----> Edit access forbidden with roles #{ability.roles.collect(&:name).join('+')}!"
    end
    where('1=0') # No access
  end

  # header for CSV export
  def csv_header
    #empty by default
    []
  end

  # row values for CSV export
  def csv_row
    #empty by default
    []
  end

  def self.geo_factory
    if self.rgeo_factory_generator == RGeo::ActiveRecord::DEFAULT_FACTORY_GENERATOR
      self.rgeo_factory_generator = RGeo::Geos.factory_generator
      rgeo_factory_settings.set_column_factory(table_name, geometry_column_name,
        RGeo::Cartesian.factory(:srid => 21781, :proj4 => '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs')
      )
    end
    rgeo_factory_for_column(geometry_column_name)
  end

end
