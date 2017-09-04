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

  # generate SQL fragment for transforming input geometry geom_sql from geom_srid to target_srid
  def self.transform_geom_sql(geom_sql, geom_srid, target_srid)
    if geom_srid.nil? || target_srid.nil? || geom_srid == target_srid
      # no transformation
    else
      # transform to target SRID
      if target_srid == 2056 && geom_srid == 21781
        geom_sql = "ST_GeomFromEWKB(ST_Fineltra(#{geom_sql}, 'chenyx06_triangles', 'geom_lv03', 'geom_lv95'))"
      elsif target_srid == 21781 && geom_srid == 2056
        geom_sql = "ST_GeomFromEWKB(ST_Fineltra(#{geom_sql}, 'chenyx06_triangles', 'geom_lv95', 'geom_lv03'))"
      else
        geom_sql = "ST_Transform(#{geom_sql}, #{target_srid})"
      end
    end

    geom_sql
  end

  def self.geometry_field
    "#{table_name}.#{connection.quote_column_name(geometry_column_name)}"
  end

  def self.extent_field(client_srid=nil)
    # transform geometry to client_srid first
    "ST_Envelope(#{transform_geom_sql(geometry_field, srid, client_srid)}) AS extent"
  end

  # NOTE: area in client_srid units
  def self.area_field(client_srid=nil)
    # transform geometry to client_srid first
    "ST_Area(#{transform_geom_sql(geometry_field, srid, client_srid)}) AS area"
  end

  # NOTE: radius in srid units
  def self.identify_filter(searchgeo, radius, nearest=false, client_srid=nil)
    filter = scoped

    client_srid ||= default_client_srid

    if searchgeo[0..3] == "POLY"
      logger.debug "*** POLY-query: #{searchgeo} ***"
      search_geom = "ST_GeomFromText('#{searchgeo}', #{client_srid})"
      center = "ST_Centroid(#{search_geom})"
    else
      if searchgeo.split(',').length == 3
        logger.debug "*** CIRCLE-query: #{searchgeo} ***"
        x1, y1, r  = searchgeo.split(',').collect(&:to_f)
        center = "ST_GeomFromText('POINT(#{x1} #{y1})', #{client_srid})"
        # NOTE: circle as buffer with radius in client_srid units
        search_geom = "ST_Buffer(#{center}, #{r}, 32)"
        radius = 0
      else
        logger.debug "*** BBOX-query: #{searchgeo} ***"
        x1, y1, x2, y2 = searchgeo.split(',').collect(&:to_f)
        search_geom = "ST_GeomFromText('POINT(#{x1+(x2-x1)/2} #{y1+(y2-y1)/2})', #{client_srid})"
        center = search_geom
      end
    end

    # transform search geometry to srid
    search_geom = transform_geom_sql(search_geom, client_srid, srid)

    # get features within radius in srid units
    filter = filter.where("ST_DWithin(#{geometry_field}, #{search_geom}, #{radius})")

    if nearest
      logger.debug "*** query nearest ***"
      # transform center to srid
      center = transform_geom_sql(center, client_srid, srid)
      # get min dist
      min_dist = filter.select("Min(ST_Distance(#{geometry_field}, #{center})) AS min_dist").first
      unless min_dist.nil?
        logger.debug "*** min_dist = #{min_dist.min_dist} ***"
        if min_dist.min_dist.to_f == 0
          # center of the search geometry is within a feature (may be overlapping features)
          filter = filter.where("ST_Within(#{center}, #{geometry_field})")
        else
          # get the feature nearest to the center of the search geometry
          filter = filter.order("ST_Distance(#{geometry_field}, #{center})").limit(1)
        end
      end
      # else no features in filter
    else
      # order by distance to center
      center = transform_geom_sql(center, client_srid, srid)
      filter = filter.order("ST_Distance(#{geometry_field}, #{center})")
    end

    filter
  end

  #Custom identify query
  #def self.identify_query(layer, query_topic, searchgeom, ability, user, client_srid=nil)
  #  # default layer query
  #  query_fields = (["#{self.table_name}.#{self.primary_key}"] + layer.ident_fields_for(ability).split(',') + [self.extent_field(client_srid), self.area_field(client_srid)]).join(',')
  #  features = scoped.identify_filter(searchgeom, layer.searchdistance, nil, client_srid).where(layer.where_filter).select(query_fields)
  #  features.all
  #end

  def bbox(client_srid=nil)
    if respond_to?('extent')
      # use extent from select(extent_field)
      envelope = GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(extent).envelope
      [envelope.lower_corner.x, envelope.lower_corner.y, envelope.upper_corner.x, envelope.upper_corner.y]
    else
      # get Box2D for this feature
      # transform geometry to client_srid first
      box_query = "Box2D(#{self.class.transform_geom_sql(self.class.geometry_field, self.class.srid, client_srid)})"
      extent = self.class.select("ST_XMin(#{box_query}), ST_YMin(#{box_query}), ST_XMax(#{box_query}), ST_Ymax(#{box_query})").find(id)
      [
        extent.st_xmin.to_f,
        extent.st_ymin.to_f,
        extent.st_xmax.to_f,
        extent.st_ymax.to_f
      ]
    end
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
      # transform filter geom to srid
      client_srid = params['srid'].blank? ? default_client_srid : params['srid'].to_i
      filter_geom = transform_geom_sql("ST_SetSRID(#{filter_geom}, #{client_srid})", client_srid, srid)
      filter = filter.where("ST_Intersects(#{geometry_field}, #{filter_geom})")
    end

    filter.limit(1000)
  end

  def self.geojson_decode(json)
    geojson = JSON.parse(json)

    # get client_srid from GeoJSON CRS
    if geojson['crs'].blank?
      client_srid = default_client_srid
    else
      client_srid = geojson['crs']['properties']['name'].split(':').last rescue default_client_srid
      # use EPSG:4326 for 'urn:ogc:def:crs:OGC:1.3:CRS84'
      client_srid = 4326 if client_srid == 'CRS84'
    end

    # NOTE: use dummy factory to set client_srid for update_attributes_from_geojson_feature()
    RGeo::GeoJSON.decode(geojson, :geo_factory => RGeo::Cartesian.factory(:srid => client_srid))
  end

  # select transformed geometry as GeoJSON
  def self.select_geojson_geom(client_srid=nil)
    # transform geometry to client_srid
    geom_sql = transform_geom_sql("#{geometry_field}", srid, client_srid)
    # select geometry as GeoJSON
    scoped.select("ST_AsGeoJSON(#{geom_sql}) AS geojson_geom, 'EPSG:' || #{client_srid || srid} AS geojson_srid")
  end

  # customize GeoJSON contents, e.g. to add custom properties or fields 
  # override in descendant classes
  def customize_geojson(geojson, options={})
    geojson
  end

  def to_geojson(options={})
    only = options.delete(:only)
    geojson = { :type => 'Feature' }
    geojson[:properties] = attributes.delete_if do |name, value|
      if name == self.class.geometry_column_name
        geojson[:geometry] = value
        true
      elsif name == 'geojson_geom' || name == 'geojson_srid'
        # skip helper fields
        true
      elsif name == self.class.primary_key then
        geojson[:id] = value
        true
      elsif only
        !only.include?(name.to_sym)
      end
    end

    geojson = customize_geojson(geojson, options)

    if attributes.has_key?('geojson_geom')
      # dummy geometry (ignore value from geometry column)
      geojson[:geometry] = {}

      unless options[:skip_feature_crs]
        # add GeoJSON CRS unless part of a FeatureCollection
        geojson[:crs] = {
          :type => 'name',
          :properties => {
            :name => attributes['geojson_srid']
          }
        }
      end

      # convert to JSON and replace geometry with GeoJSON field from query
      geojson.to_json.sub(/"geometry":{}/, "\"geometry\":#{attributes['geojson_geom']}")
    else
      geojson.to_json
    end
  end

  def update_attributes_from_geojson_feature(feature, user)
    attr = feature.properties

    unless feature.geometry.nil?
      # get client_srid from RGeo geometry
      client_srid = feature.geometry.srid
      if client_srid != self.class.srid
        # transform feature geometry to srid
        geom_sql = self.class.transform_geom_sql("ST_GeomFromText('#{feature.geometry.as_text}', #{client_srid})", client_srid, self.class.srid)
        sql = "SELECT ST_AsText(#{geom_sql}) AS wkt_geom"
        results = connection.execute(sql)
        results.each do |result|
          attr[self.class.geometry_column_name] = self.class.geo_factory.parse_wkt(result['wkt_geom'])
        end
      else
        # no transformation
        attr[self.class.geometry_column_name] = feature.geometry
      end
    end

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
    @layers ||= Layer.where(:table => self.table_name).all
    can_edit = false
    @layers.each do |layer|
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

  # default client_srid

  @@default_client_srid = 21781

  def self.set_default_client_srid(client_srid)
    @@default_client_srid = client_srid
  end

  def self.default_client_srid
    @@default_client_srid
  end

  # default geo factory

  @@default_rgeo_factory = RGeo::Cartesian.factory(:srid => 21781, :proj4 => '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs')

  def self.set_default_rgeo_factory(factory)
    @@default_rgeo_factory = factory
  end

  def self.default_rgeo_factory
    @@default_rgeo_factory
  end

  def self.geo_factory
    if self.rgeo_factory_generator == RGeo::ActiveRecord::DEFAULT_FACTORY_GENERATOR
      self.rgeo_factory_generator = RGeo::Geos.factory_generator
      rgeo_factory_settings.set_column_factory(table_name, geometry_column_name,
        default_rgeo_factory
      )
    end
    rgeo_factory_for_column(geometry_column_name)
  end

end
