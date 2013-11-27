require 'hpricot'

class Layer < ActiveRecord::Base
  has_many :topics_layers, :dependent => :destroy
  has_many :topics, :through => :topics_layers
  belongs_to :sublayer_group

  attr_protected []

  validates :name, :presence => true, :uniqueness => {:scope => :topic_name}
  validates_format_of :name, :with => /\A[A-Za-z][\w-]*\Z/
  validates_format_of :topic_name, :with => /\A[\w-]+\Z/

  scope :defaultorder, order(:topic_name, :name)
  scope :unused, includes(:topics_layers).where('topics_layers.layer_id IS NULL')

  #Namespace for run-time geo classes
  module Geo
  end

  # Enum for RailsAdmin form (causes exception in name search)
  #def sublayer_group_enum
  #  SublayerGroup.all.collect {|p| [ p.name, p.id ] }
  #end

  #Structure for Topic selection
  def self.list(ability, layer_type, topic_name)
    ActiveRecord::Base.silence do
      topic = Topic.accessible_by(ability).includes(:layers).where(:name => topic_name).first
      layers = topic.nil? ? [] : topic.layers.accessible_by(ability).all
      topic_layers = topic.nil? ? [] : topic.topics_layers.select {|tl| layers.include?(tl.layer) }
      wms_layer_list(ability, topic, topic_layers)
    end
  end

  def self.wms_layer_list(ability, topic, topic_layers)
    wms_layers = topic_layers.collect do |topic_layer|
      layer = topic_layer.layer
      {
        "id" => topic_layer.id,
        "layername"=> layer.name,
        "topic"=> topic.name,
        "groupname" => layer.sublayer_group.try(:name),
        "toclayertitle"=> layer.title,
        "leglayertitle"=> layer.title,
        "showscale"=> "true",
        "minscale"=> layer.minscale,
        "maxscale"=> layer.maxscale,
        "wms_sort"=> topic_layer.wms_sort, # MapServer layer order
        #"leg_sort"=> topic_layer.leg_sort, # Not used client side (Legend sort is in defined in HTML). Query result order. 
        #"query_sort"=> topic_layer.leg_sort, # deprecated
        "toc_sort"=> topic_layer.toc_sort, # Layer tree order
        "wms"=> "false",
        "visini"=> topic_layer.visini,
        "visuser"=> topic_layer.visini, #User visibility is in request_state
        "showtoc"=> "true",
        "editeable"=> ability.can?(:edit, layer)
      }
    end
    {
      "success" => true,
      "messageProperty"=> {"topic"=> topic.name, "legendtitle"=> "Legende", "legendraster"=> "true"},
      "results"=> wms_layers.size,
      "wmslayers"=> wms_layers
    }
  end

  def full_name
    "#{topic_name}-#{name}".downcase
  end

  def feature_class
    fc = "Geo::#{feature_class_name}".constantize rescue nil #Geo.const_defined?(feature_class_name) seems not to work here
    fc ||= Geo.module_eval <<EOS
      class #{feature_class_name} < GeoModel
        self.table_name = '#{table}'
        self.primary_key = '#{pkey}'

        self
      end
EOS
  end

  def feature_class_name
    table.camelize.singularize
  end

  def geometry_column
    feature_class.try(:geometry_column)
  end

  def attribute(name)
    if feature_class.nil?
      ::Attribute.new(self, name)
    else
      @attrs ||= feature_class.columns.inject({}) do |h, c|
        #logger.info "************************* feature_class column c #{c.inspect}"
        h[c.name] = ::Attribute.new(self, c.name)
        h
      end
      @attrs[name] ||= ::Attribute.new(self, name) #Add ad-hoc Attr. for calculated columns (e.g. custom SQL in query fields)
    end
    #logger.info "************************* Attribute for name '#{name}': #{@attrs[name].inspect}"
  end

  #def filtered(ability)
  #  feature_class.where(ability.resource_access_filter(self))
  #end

  def query_fields(ability)
    return '' if feature_class.nil?
    ([pkey]+ident_fields_for(ability)+[feature_class.extent_field, feature_class.area_field]).join(',')
  end

  def ident_fields_for(ability)
    #attributes.accessible_by(ability) & fields
    #logger.info "************************* fields layer #{name}: #{ident_fields}"
    #logger.info "************************* roles: #{ability.roles.collect(&:name).join(',')}"
    fields = (ident_fields || pkey).split(',')
    allowed_fields = fields.select { |f| ability.can?(:show, attribute(f)) }
    #logger.info "************************* ident_fields layer #{name}: #{allowed_fields.inspect}"
    allowed_fields
  end

  def query(ability, query_topic, searchgeo)
    if table =~ /^https?:/
      features = get_feature_info(searchgeo)
      [self, features, searchgeo.split(',')]
    elsif feature_class
      begin
        #query_topic: {... customQueries: {<layername>: <query_method> }
        #e.g.
        #{"queryTopics":[{
        #   "level":"main","topic":"Lageklassen2011ZH","divCls":"legmain","layers":"seen,lageklassen-2011-flaechen,grenzen,gemeindegrenzen,bezirkslabels"
        #   customQueries: {'seen': 'tiefen_statistik'},
        #   customParams: {'tiefe': 25}
        #  }]}
        custom_query_method = query_topic['customQueries'][name] rescue nil
        logger.debug "******** #{feature_class} ***************************************************"
        features = if custom_query_method
          logger.debug "*** Custom query on layer #{name}: #{query_topic.inspect}"
          feature_class.send(custom_query_method, self, query_topic, searchgeo) 
        elsif feature_class.respond_to?(:identify_query)
          logger.debug "*** Custom identify_query on layer #{name}"
          feature_class.identify_query(searchgeo, searchdistance)
        else
          logger.debug "*** Identify on layer #{name} with query fields #{query_fields(ability)} at #{searchgeo.inspect}"
          feature_class.identify_filter(searchgeo, searchdistance).select(query_fields(ability)).all
        end
        logger.debug "Number of features: #{features.size}"
        # calculate bbox of all features
        unless features.empty?
          envelope = GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(features.first['extent']).envelope
          features.each do |feature|
            next if feature == features.first
            envelope.extend!(GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(feature['extent']).envelope)
          end
          bbox = [envelope.lower_corner.x, envelope.lower_corner.y, envelope.upper_corner.x, envelope.upper_corner.y]
        end
      rescue Exception => e
        features = "Table: <b>#{table}</b><br/>Exception: #{e}<br/>query fields: #{query_fields(ability)}<br/>db fields: #{feature_class.column_names.join(',')}<br/>missing: <font color='red'>#{(query_fields(ability).split(',') - feature_class.column_names).join(', ')}</font><br/><br/>"
        logger.info "Identify error on layer #{name} #{features}"
      end
      [self, features, bbox]
    else
      logger.warn "Table for layer #{name} not found. (Table name: '#{table}')"
      nil
    end
  end

  def get_feature_info(searchgeo)
    logger.debug searchgeo.inspect
    x1, y1, x2, y2 = searchgeo.split(',').collect(&:to_f)
    #Since we get the query coordinates and not pixels, we have to assume a certain scale
    dist = (x1*0.01).abs
    params = [
      "FEATURE_COUNT=10",
      "INFO_FORMAT=application/vnd.ogc.gml", #text/xml
      "REQUEST=GetFeatureInfo",
      "SERVICE=WMS",
      "BBOX=#{x1},#{y1},#{x1+dist},#{y1+dist}",
      "WIDTH=100",
      "HEIGHT=100",
      "X=0", "I=0",
      "Y=99", "J=99"
    ]
    url = "#{table}&#{params.join('&')}"
    logger.debug "*** Cascaded GetFeatureInfo: #{url}"
    uri = URI.parse(url)
    http = Net::HTTP::new(uri.host, uri.port, nil, CASCADED_PROXY_PORT, CASCADED_PROXY_USER, CASCADED_PROXY_PASS)
    response = http.request(Net::HTTP::Get.new(uri.request_uri))
    #logger.debug response.body
    info_features = parse_ogc_gml(response.body)
    features = info_features.collect {|f| f[:attributes] }
    logger.debug features.to_s
    logger.debug "Number of features: #{features.size}"
    features
  end

  def parse_ogc_gml(xml)
    info_features = []
    fields = ident_fields.split(',')
    doc = Hpricot::XML(xml)

    (doc/"//gml:featureMember").each do |fm|
      fm.children.each do |feature|
        info_feature = {}

        # attributes
        attributes = {}
        feature.containers.each do |c|
          if fields.include?(c.name)
            attributes[c.name] = c.inner_text
          end
        end
        info_feature[:attributes] = attributes

        info_features << info_feature
      end
    end

    info_features
  end

  # Partial for identify result
  def info_fname
    "_#{name}_info.html.erb"
  end

  def info_file
    File.join(Rails.root, 'app', 'views', 'layers', 'custom', topic_name.downcase, info_fname)
  end

  def info_file_auto
    File.join(Rails.root, 'app', 'views', 'layers', 'custom', topic_name.downcase, 'auto', info_fname)
  end

  # ignore auto file if empty file exists
  def info_file_empty
    File.join(Rails.root, 'app', 'views', 'layers', 'custom', topic_name.downcase, "_#{name}_info_leer.html.erb")
  end

  def info
    @info ||= begin
      if File.exist?(info_file)
        "layers/custom/#{topic_name.downcase}/#{info_fname[1..-10]}"
      elsif !File.exist?(info_file_empty) && File.exist?(info_file_auto)
        "layers/custom/#{topic_name.downcase}/auto/#{info_fname[1..-10]}"
      else
        nil
      end
    end
  end

  def infotext(count)
    count > 0 ? "resultcount_p" : "resultcount_s"
  end

  def infotab
    #  INFOLAYOUT=0^1^2^3^4^5^6^7  *** Wenn der Parameter = 1 ist, wird ein leerer String �bergeben.
    #                              *** Wenn der Parameter = 0 ist, wird der entsprechende Teil weggelassen wenn m�glich
    #
    #  LayoutString(0) = "Im Umkreis von <EM>xUmkreisx</EM> Meter(n) wurde <EM>xAnzahlx</EM> Datensatz gefunden.<br><br>"
    #  LayoutString(1) = "Im Umkreis von <EM>xUmkreisx</EM> Meter(n) wurden <EM>xAnzahlx</EM> Datens&aumltze gefunden.<br><br>"
    #  LayoutString(2) = "layer"
    #  LayoutString(3) = "infotext"
    #  LayoutString(4) = "infotab"
    #  LayoutString(5) = "tabtitle"
    #  LayoutString(6) = "tabcell"
    #  LayoutString(7) = "2"  ( If = "" Then 1 Tabellenzeile pro Record [z.B. "1" oder ""], else [z.B. "2"] 1 Zeile pro Feld)

    "infotable_horizontal"
  end

  def legend_fname
    "_#{name}_legend.html.erb"
  end

  def legend_file
    File.join(Rails.root, 'app', 'views', 'layers', 'custom', topic_name.downcase, legend_fname)
  end

  def legend_file_auto
    File.join(Rails.root, 'app', 'views', 'layers', 'custom', topic_name.downcase, 'auto', legend_fname)
  end

  def legend
    @legend ||= begin
      if File.exist?(legend_file)
        "layers/custom/#{topic_name.downcase}/#{legend_fname[1..-10]}"
      elsif File.exist?(legend_file_auto)
        "layers/custom/#{topic_name.downcase}/auto/#{legend_fname[1..-10]}"
      else
        nil
      end
    end
  end

  def quoted_wms_layers
    wms_layers.split(',').collect {|l| %Q<"#{l}"> }.join(',')
  end

  DEFAULT_SELECTION_STYLE = {
    'POLYGON' =>
      '<PolygonSymbolizer>'+
        '<Fill>'+
          '<CssParameter name="fill">#ff0090</CssParameter>'+
          '<CssParameter name="fill-opacity">0.6</CssParameter>'+
        '</Fill>'+
        '<Stroke>'+
          '<CssParameter name="stroke">#ff0090</CssParameter>'+
          '<CssParameter name="stroke-width">2.00</CssParameter>'+
        '</Stroke>'+
      '</PolygonSymbolizer>',
    'LINESTRING' =>
      '<LineSymbolizer>'+
        '<Stroke>'+
          '<CssParameter name="stroke">#ff0090</CssParameter>'+
          '<CssParameter name="stroke-width">10.00</CssParameter>'+
        '</Stroke>'+
      '</LineSymbolizer>',
    'POINT' =>
      '<PointSymbolizer>'+
         '<Graphic>'+
           '<Mark>'+
             '<WellKnownName>circle</WellKnownName>'+
             '<Fill>'+
               '<CssParameter name="fill">#ff0090</CssParameter>'+
             '</Fill>'+
           '</Mark>'+
           '<Size>45.0</Size>'+
         '</Graphic>'+
       '</PointSymbolizer>'
  }

  def selection_symbolizer
    if selection_style.blank?
      gtyp = feature_class.geometry_type.sub(/^MULTI/, '').sub(/M$/, '') #MULTIPOINTM -> POINT 
      logger.error "Unsupported selection geometry type #{feature_class.geometry_type}" unless DEFAULT_SELECTION_STYLE.has_key?(gtyp)
      DEFAULT_SELECTION_STYLE[gtyp] || ''
    else
      selection_style
    end
  end

end
