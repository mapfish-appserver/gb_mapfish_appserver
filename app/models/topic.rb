require 'acts_as_tree'

# OpenLayers "layer" (WMS, etc.)
class Topic < ActiveRecord::Base
  acts_as_tree #parent_id could be replaced with topics_topics relation

  has_many :categories_topics, :dependent => :destroy
  has_many :categories, :through => :categories_topics
  belongs_to :bg_topic, :class_name => 'Topic'
  has_and_belongs_to_many :overlay_topics, :class_name => 'Topic', :association_foreign_key => 'overlay_topic_id'
  has_many :topics_layers
  has_many :layers, :through => :topics_layers
  belongs_to :organisation

  attr_protected []

  accepts_nested_attributes_for :topics_layers, :allow_destroy => true
  accepts_nested_attributes_for :layers, :allow_destroy => true

  serialize :ollayer_args, JSON

  validates :name, :presence => true, :uniqueness => true

  # Enum for RailsAdmin form
  def category_enum
    Category.all.collect {|p| [ p.name, p.id ] }
  end

  # Enum for RailsAdmin form (causes exception in name search)
  #def parent_enum
  #  Topic.all.collect {|p| [ p.name, p.id ] }
  #end

  def geolion_gdd(site)
    site == SITE_DEFAULT ? geolion_gdd_internet : geolion_gdd_intranet
  end

  #Structure for Topic selection
  def self.list(app, current_ability, zone, wms_host)
    topics = []
    ActiveRecord::Base.silence do
      app.gbapplications_categories.includes(:category).each do |gbapplications_category|
        category = gbapplications_category.category
        unless category.nil?
          category_topics = category.topics.accessible_by(current_ability)
          category_topics = category_topics.includes(:organisation).includes(:bg_topic).includes(:overlay_topics) # optimize query performance
          category_topics = category_topics.select('topics.*,categories_topics.sort AS categories_topics_sort')

          topics += category_topics.collect do |topic|
            subtopics = category_topics.select{|t| t.parent_id == topic.id}.collect do |subtopic|
              {
                "subtopicname" => subtopic.name,
                "subtopictitle" => subtopic.sub_title,
                "categories_topics_sort" => subtopic['categories_topics_sort'].to_i
              }
            end
            categorysort = gbapplications_category.sort - 1000*gbapplications_category.gbapp_specific rescue nil

            tools = Tool.accessible_tools(topic, current_ability)

            keywords = topic.title.split + (topic.keywords || '').split(',').collect(&:strip)

            {
              "name" => topic.name,
              "title" => topic.title,
              "print_title" => topic.print_title,
              "icon" => "/images/custom/themekl-#{topic.name.downcase}.gif",
              "organisationtitle" => topic.organisation.try(:title),
              "organisationsort" => topic.organisation.try(:sort),
              "categorytitle" => category.title,
              "gbapp_specific" => gbapplications_category.gbapp_specific,
              "categorysort" => categorysort,
              "categories_topics_sort" => topic['categories_topics_sort'].to_i,
              "keywords" => keywords,
              "geoliongdd" => topic.geolion_gdd(zone),
              "parent_id" => topic.parent_id,
              "hassubtopics" => subtopics.size > 0,
              "subtopics" => subtopics,
              "missingpermission" => current_ability.cannot?(:show, topic),
              "tools" => tools,
              "ollayer_class" => topic.ollayer_class, #z.B. "WMS"
              "ollayer_type" => topic.ollayer_args, #z.B. { name: "NASA Global Mosaic", url: "http://wms.jpl.nasa.gov/wms.cgi", params: {layers: "modis,global_mosaic"} }
              "bg_topic" => topic.bg_topic.try(:name),
              "overlay_topics" => topic.overlay_topics.collect(&:name),
              "wms_url" => "#{wms_host}/#{topic.name}",
              "background_layer" => topic.background_layer,
              "main_layer" => topic.main_layer,
              "overlay_layer" => topic.overlay_layer,
              "minscale" => topic.minscale,
              "gb1_params" => topic.gb1_params  #TODO: generalized param for custom viewers
            }
          end
        end
      end
    end
    {
      "success" => true,
      #"activeTopic" => {"topicname" => "av", "grouping" => "theme"}, #TODO: from session
      "gbtopics" => topics,
      "results" => topics.size
    }
  end

  def icon_fname
    "themekl-#{name.downcase}.gif"
  end

  #Topic legend collection
  def legend_fname
    "_#{name.downcase}_legend.html.erb"
  end

  def legend_file
    File.join(Rails.root, 'app', 'views', 'topics', 'custom', legend_fname)
  end

  def legend_file_auto
    File.join(Rails.root, 'app', 'views', 'topics', 'custom', 'auto', legend_fname)
  end

  def legend
    @legend ||= begin
      if File.exist?(legend_file)
        "topics/custom/#{legend_fname[1..-10]}"
      elsif File.exist?(legend_file_auto)
        "topics/custom/auto/#{legend_fname[1..-10]}"
      else
        nil
      end
    end
  end

  #header template
  def self.query_header_fname
    "_query_header.html.erb"
  end

  def self.query_header_file
    File.join(Rails.root, 'app', 'views', 'topics', query_header_fname)
  end

  def self.query_header
    @query_header ||= File.exist?(query_header_file) ? "topics/#{query_header_fname[1..-10]}" : nil
  end

  #header template for each topic
  def info_header_fname
    "_#{name.downcase}_info.html.erb"
  end

  def info_header_file
    File.join(Rails.root, 'app', 'views', 'topics', 'custom', info_header_fname)
  end

  def info_header
    @info_header ||= File.exist?(info_header_file) ? "topics/custom/#{info_header_fname[1..-10]}" : nil
  end

  # print disclaimer

  def self.default_print_disclaimer
    File.open(File.join(Rails.root, 'app', 'views', 'topics', '_print_disclaimer.txt'), 'r') { |f| f.read }
  end

  def print_disclaimer
    @disclaimer ||= begin
      fname = File.join(Rails.root, 'app', 'views', 'topics', 'custom', "_#{name.downcase}_print_disclaimer.txt")
      if File.exist?(fname)
        # use custom topic disclaimer if there exists a corresponding text file
        File.open(fname, 'r') { |f| f.read }
      else
        Topic.default_print_disclaimer
      end
    end
  end

  def roles
    perms = Permission.where(:resource_type => 'Topic', :resource => name).includes(:role)
    perms.collect(&:role)
  end

  def query(ability, query_topic, searchbbox, nearest=false)
    active_layers = query_topic['layers'].split(',')
    qlayers = query_layers(ability, active_layers)
    results = []
    qlayers.each do |layer|
      result = layer.query(ability, query_topic, searchbbox, nearest)
      results << result unless result.nil?
    end
    results
  end

  def query_layers(ability, active_layers) #TODO: 0.5s
    ActiveRecord::Base.silence do
      layers.accessible_by(ability).where('topics_layers.queryable').order('topics_layers.leg_sort DESC').find_all do |layer|
        active_layers.include?(layer.name)
      end
    end
  end

end
