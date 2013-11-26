namespace :mapfile do

  require 'rubygems'
  require 'iconv'

  desc "Create a topic from a mapfile. MAPFILE=file SITE=host DBONLY=false"
  task :import_topic => :environment do
    mapfile = ENV['MAPFILE']
    site = ENV['SITE'] || SITE_DEFAULT #Use empty string for unpublished map
    dbonly = ENV['DBONLY'] || false
    if mapfile.nil?
      puts "Error: Missing argument MAPFILE"
    else
      import = MapfileImport.new(mapfile, site)
      import.import(dbonly)
    end
  end

  desc "Create a topic from a mapfile. MAPFILE=file"
  task :gen_topic_legends => :environment do
    topicname = ENV['TOPIC']
    topics = Topic.scoped
    topics = topics.where(:name => topicname) if topicname
    topics.each do |topic|
      MapfileImport.gen_topic_legend(topic)
    end
  end

  class MapfileImport
    begin
      require 'ruby_mapscript'
      include Mapscript
    rescue Exception => e
      #Ignore missing mapscript lib on Windows
    end
    include FileUtils

    def initialize(mapfile, site)
      @map = MapObj.new(mapfile)
      @site = site || DEFAULT_SITE
    end

    def import(dbonly = false)
      topic = Topic.find_or_create_by_name(@map.name)
      topic.title = @map.web.metadata['ows_title'] || @map.web.metadata['wms_title']
      puts "Importing topic '#{topic.name}' with title '#{topic.title}'"
      topic.print_title = topic.title
      topic.geolion_gdd_intranet = @map.web.metadata['geolion_gdd_intranet']
      topic.geolion_gdd_internet = @map.web.metadata['geolion_gdd_internet']
      topic.minscale = @map.web.metadata['gb_minscale']
      topic.main_layer = true if topic.main_layer.nil?
      topic.save!

      Layer.unused.destroy_all
      SublayerGroup.unused.destroy_all

      category = @map.web.metadata['gb_category'] || 'Uncategorized'
      if topic.categories.empty?
        topic.categories << Category.find_or_create_by_title(category)
      end

      sublayer_groups = {}

      #Show Symbols
      #@map.symbolset.symbols.each do |symbol|
      #  puts "Symbol #{symbol.name} #{symbol.imagepath}"
      #end

      @map.layers.each_with_index do |mlayer, layerno|
        topic_name = mlayer.metadata['gb_topic_name'] || topic.name
        queryable = mlayer.template != nil
        layer_name = if mlayer.group && !queryable
          mlayer.group
        else
          mlayer.name
        end

        layer = Layer.where(:name => layer_name, :topic_name => topic_name).first
        if mlayer.group && !queryable
          group_layer_created = !layer.nil? && topic.layers.include?(layer)
          if group_layer_created
            #Update scales only
            puts "Hiding grouped layer '#{mlayer.name}'"
            layer.minscale = [layer.minscale || mlayer.minscaledenom, mlayer.minscaledenom].min if mlayer.minscaledenom >= 0
            layer.maxscale = [layer.maxscale || mlayer.maxscaledenom, mlayer.maxscaledenom].max if mlayer.maxscaledenom >= 0
            layer.save!
            next
          end
        end
        layer ||= Layer.new
        layer.name = layer_name
        puts "Creating layer '#{layer.name}'"
        layer.title = mlayer.metadata['wms_title']
        layer.geolion_gds = mlayer.metadata['geolion_gds']
        layer.selection_style = mlayer.metadata['gb_selection_style']
        layer.topic_name = topic_name
        layer.minscale = mlayer.minscaledenom if mlayer.minscaledenom >= 0
        layer.maxscale = mlayer.maxscaledenom if mlayer.maxscaledenom >= 0
        puts "Warning: maxcale of layer '#{layer.name}' undefined" unless layer.maxscale
        if mlayer.connectiontype == MS_POSTGIS
          mlayer.data =~ /FROM ["']?(\w+)["']?/i
          layer.table = $1
          puts "Warning: Couldn't extract table name of layer '#{layer.name}' from data '#{mlayer.data}'" if layer.table.blank?
          mlayer.data =~ /UNIQUE (\w+)/i
          layer.pkey = $1 || 'oid'
        elsif mlayer.connectiontype == MS_WMS
          url = mlayer.getWMSFeatureInfoURL(@map, 0, 0, 10, "text/xml")
          #extract necessary params
          params = url.split(/[?&]/).select {|p| k,v=p.split('='); %w(LAYERS QUERY_LAYERS VERSION SRS CRS).include?(k) || k =~ /^https?:/ }
          layer.table = "#{params.shift}?#{params.join('&')}"
        end

        #ident_fields+alias_fields
        if mlayer.metadata.key?('wms_include_items')
          layer.ident_fields = mlayer.metadata['wms_include_items'].gsub(/,\s+/, ',')
          layer.alias_fields = layer.ident_fields.split(',').collect do |ident_field|
            mlayer.metadata["gml_#{ident_field}_alias"] || ident_field
          end.join(',')
        end

        #sublayer_group
        if mlayer.metadata.key?('wms_group_title')
          group_name = mlayer.metadata['wms_group_title']
          layer.sublayer_group = sublayer_groups[group_name]
          if layer.sublayer_group.nil?
            layer.sublayer_group = SublayerGroup.create!(:name => group_name)
            sublayer_groups[group_name] = layer.sublayer_group
          end
        end

        #searchdistance
        layer.searchdistance = mlayer.metadata['gb_searchdistance'] || case mlayer.type
          when MS_LAYER_POINT then 50
          when MS_LAYER_LINE then 50
          when MS_LAYER_POLYGON then 0
          else
            50 #Annotation
          end

        layer.save!

        unless dbonly
          #Info & Legend
          mkdir_p File.dirname(layer.info_file_auto)

          display_only = (mlayer.type == MS_LAYER_RASTER && mlayer.connectiontype != MS_WMS) || mlayer.type == MS_LAYER_ANNOTATION
          if queryable
            if display_only
              puts "Warning: Raster/Anntotation layer '#{layer.name}' is queryable (TEMPLATE #{mlayer.template})"
            end
            #puts "Creating #{layer.info_file_auto}"
            fields = layer.ident_fields.split(',') rescue []
            aliases = if fields.empty?
              puts "Warning: Query layer '#{layer.name}' has no attribute definition (wms_include_items)"
              []
            else
              layer.alias_fields.split(',')
            end
            infotab_template = "_infotable_auto"
            template = File.open(File.join(Rails.root, 'lib', 'tasks', 'templates', "#{infotab_template}.html.erb")).read
            template = ERB.new(template, nil, '<>')
            File.open(layer.info_file_auto, 'w') do |file|
              file << template.result(binding)
            end
          end

          # Layer legend
          legend_icon_path = File.join(Rails.root, 'public', 'images', 'custom', topic_name.downcase)
          mkdir_p legend_icon_path
          if !display_only
            #puts "Creating #{layer.legend_file_auto}"
            File.open(layer.legend_file_auto, 'w') do |file|
              file << "<table class='legtab'>\n"
              mlayer.classes.each_with_index do |lclass, i|
                #Symbol size for Polygon and Line layers
                width = 23
                height = 13
                filename = nil
                if mlayer.type == MS_LAYER_POINT
                  style = lclass.styles.first
                  if style.nil?
                    puts "Warning: Missing style in layer '#{layer.name}'"
                  else
                    symbol = @map.symbolset.symbols[style.symbol]
                    if style.size > 0
                      width = height = style.size.to_i+1
                    end
                    if symbol.imagepath
                      filename = symbol.imagepath
                    end
                  end
                end
                if filename.nil?
                  begin
                    icon = lclass.createLegendIcon(@map, mlayer, width, height)
                    filename = "#{layer.name}#{i}.png"
                    icon.save(File.join(legend_icon_path, filename))
                  rescue Exception => e
                    puts "Warning: createLegendIcon for class '#{lclass.name}' failed: #{e}"
                  end
                else
                  symfile = File.join(@map.mappath, filename)
                  filename = File.basename(filename)
                  cp(symfile, File.join(legend_icon_path, filename))
                end
                sympath ="/images/custom/#{topic_name.downcase}/#{filename}"
                legtext = lclass.name || lclass.getExpressionString
                legtext = legtext.force_encoding('UTF-8') if legtext.respond_to?(:force_encoding)
                file << "  <%= leg_tab_row('#{legtext}', '#{sympath}') %>\n"
              end
              file << "</table>\n"
            end
          end
        end

        #topics_layers
        tl = topic.topics_layers.where(:layer_id => layer).first || topic.topics_layers.build(:layer => layer)
        tl.queryable = queryable
        tl.visini = mlayer.status == MS_ON
        tl.wms_sort = layerno
        #Do now overwrite values changed manually in the DB:
        tl.leg_sort = mlayer.metadata['gb_leg_sort'] if mlayer.metadata['gb_leg_sort']
        tl.toc_sort = mlayer.metadata['gb_toc_sort'] if mlayer.metadata['gb_toc_sort']
        tl.leg_sort ||= layerno*100
        tl.toc_sort ||= layerno*100
        tl.save!
      end

      unless dbonly
        #Legend Template
        mkdir_p File.dirname(topic.legend_file_auto)
        MapfileImport.gen_topic_legend(topic)

        #Info Header Template
        #puts "Creating #{topic.info_header_file}"
        touch(topic.info_header_file)

        #Topic icon
        topic_icon = File.join(Rails.root, 'public', 'images', 'custom', topic.icon_fname)
        unless File.exist?(topic_icon)
          mkdir_p File.dirname(topic_icon)
          cp(File.join(File.dirname(__FILE__), 'templates', 'themekl-default.gif'),
            topic_icon)
        end
      end

      unless @site.empty?
        site_role = Role.find_or_create_by_name(@site)
        #View permissions
        if site_role.permissions.where(:resource_type => 'Topic', :resource => topic.name).count == 0
          site_role.permissions.create!(:sequence => 0,
          :action => 'show', :resource_type => 'Topic', :resource => topic.name)
          site_role.permissions.create!(:sequence => 0,
          :action => 'show', :resource_type => 'Wms', :resource => topic.name)
          site_role.permissions.create!(:sequence => 0,
          :action => 'show', :resource_type => 'Layer', :resource => "#{topic.name}/*")
          #topic.topics_layers.each_with_index do |tl,i|
          #  if tl.queryable
          #    site_role.permissions.create!(:sequence => i,
          #    :action => 'show', :resource_type => 'Attribute', :resource => "#{tl.layer.name}/*")
          #end
        end
      end
    end

    def self.gen_topic_legend(topic)
      #puts "Creating #{topic.legend_file_auto}"
      File.open(topic.legend_file_auto, 'w') do |file|
        #file << '<%= metatag(@topic.geolion_gdd(@zone)) %>' << "\n"
        for layer in topic.layers.order('topics_layers.leg_sort DESC') do
          #TODO?: unless mlayer.metadata['gb_hide_legend']
          if layer.legend
            file <<<<EOS
<div class="legpart">
  <p class="layer">#{layer.title}</p>
EOS
            file << "  <%= metatag('#{layer.geolion_gds}') %>" if layer.geolion_gds
            file <<<<EOS
  <%= render :partial => '#{layer.legend}', :as => :legend %>
</div>
EOS
          end
        end
      end
    end

  end

end
