# RailsAdmin config file. Generated on July 18, 2012 13:10
# See github.com/sferik/rails_admin for more informations

RailsAdmin.config do |config|

  # If your default_local is different from :en, uncomment the following 2 lines and set your default locale here:
  # require 'i18n'
  # I18n.default_locale = :de

  config.current_user_method { current_user } # auto-generated

  config.authorize_with :cancan

  # If you want to track changes on your models:
  # config.audit_with :history, User

  # Or with a PaperTrail: (you need to install it first)
  # config.audit_with :paper_trail, User

  # Set the admin name here (optional second array element will appear in a beautiful RailsAdmin red ©)
  config.main_app_name = ['Gb2', 'Admin']
  # or for a dynamic name:
  # config.main_app_name = Proc.new { |controller| [Rails.application.engine_name.titleize, controller.params['action'].titleize] }


  #  ==> Global show view settings
  # Display empty fields in show views
  # config.compact_show_view = false

  #  ==> Global list view settings
  # Number of default rows per-page:
  # config.default_items_per_page = 20

  #  ==> Included models
  # Add all excluded models here:
  #config.excluded_models << Address << Municipality << Parcel << GeometryColumn << GeoModel
  #begin
  #  config.excluded_models << Geo::AvzhHausnummerPosP << Geo::AlnFnsApliwaPflegeF << Geo::AlnFnsApliwaPflegeArchivF << Geo::AlnFnsApliwaMasslinieL << Geo::AlnFnsBunKonstruktionP
  #rescue
  #  puts "Ignoring Error when loading Geo models in initializers/rails_admin.rb"
  #end

  # Add models here if you want to go 'whitelist mode':
  config.included_models = [AccessFilter, CategoriesTopic, Category, Gbapplication, GbapplicationsCategory, Group, GroupsUser, Layer, Organisation, Permission, Role, SublayerGroup, Topic, TopicsLayer, User]

  # Application wide tried label methods for models' instances
  # config.label_methods << :description # Default is [:name, :title]

  #  ==> Global models configuration
  # config.models do
  #   # Configuration here will affect all included models in all scopes, handle with care!
  #
  #   list do
  #     # Configuration here will affect all included models in list sections (same for show, export, edit, update, create)
  #
  #     fields_of_type :date do
  #       # Configuration here will affect all date fields, in the list section, for all included models. See README for a comprehensive type list.
  #     end
  #   end
  # end
  #
  #  ==> Model specific configuration
  # Keep in mind that *all* configuration blocks are optional.
  # RailsAdmin will try his best to provide the best defaults for each section, for each field.
  # Try to override as few things as possible, in the most generic way. Try to avoid setting labels for models and attributes, use ActiveRecord I18n API instead.
  # Less code is better code!
  # config.model MyModel do
  #   # Cross-section field configuration
  #   object_label_method :name     # Name of the method called for pretty printing an *instance* of ModelName
  #   label 'My model'              # Name of ModelName (smartly defaults to ActiveRecord's I18n API)
  #   label_plural 'My models'      # Same, plural
  #   weight -1                     # Navigation priority. Bigger is higher.
  #   parent OtherModel             # Set parent model for navigation. MyModel will be nested below. OtherModel will be on first position of the dropdown
  #   navigation_label              # Sets dropdown entry's name in navigation. Only for parents!
  #   # Section specific configuration:
  #   list do
  #     filters [:id, :name]  # Array of field names which filters should be shown by default in the table header
  #     items_per_page 100    # Override default_items_per_page
  #     sort_by :id           # Sort column (default is primary key)
  #     sort_reverse true     # Sort direction (default is true for primary key, last created first)
  #     # Here goes the fields configuration for the list view
  #   end
  # end

  # Your model's configuration, to help you get started:

  # All fields marked as 'hidden' won't be shown anywhere in the rails_admin unless you mark them as visible. (visible(true))

  # config.model AccessFilter do
  #   # Found associations:
  #     configure :role, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :role_id, :integer         # Hidden 
  #     configure :resource_type, :string 
  #     configure :resource, :string 
  #     configure :condition, :text   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Address do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :id, :integer 
  #     configure :ort, :string 
  #     configure :str_name, :string 
  #     configure :post_nr, :string 
  #     configure :plz, :integer 
  #     configure :y, :integer 
  #     configure :x, :integer 
  #     configure :gvz_nuz, :string 
  #     configure :snd_ort1, :string 
  #     configure :snd_ort2, :string 
  #     configure :snd_str1, :string 
  #     configure :snd_str2, :string 
  #     configure :nr_sort, :integer 
  #     configure :nr_such, :string 
  #     configure :gblink, :string 
  #     configure :quelle, :string 
  #     configure :bfs_nr, :integer 
  #     configure :parz_nr, :string 
  #     configure :gvz_nr, :string 
  #     configure :gwr_egid, :integer 
  #     configure :gwr_edid, :integer 
  #     configure :gbd_nu, :integer 
  #     configure :adr_st, :string 
  #     configure :onrp, :integer   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model CategoriesTopic do
  #   # Found associations:
  #     configure :category, :belongs_to_association 
  #     configure :topic, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :category_id, :integer         # Hidden 
  #     configure :topic_id, :integer         # Hidden 
  #     configure :sort, :integer 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Category do
  #   # Found associations:
  #     configure :categories_topics, :has_many_association 
  #     configure :topics, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :title, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime 
  #     configure :description, :text   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Gbapplication do
  #   # Found associations:
  #     configure :gbapplications_categories, :has_many_association 
  #     configure :categories, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :title, :string 
  #     configure :description, :text 
  #     configure :sort, :integer 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime 
  #     configure :name, :string   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model GbapplicationsCategory do
  #   # Found associations:
  #     configure :gbapplication, :belongs_to_association 
  #     configure :category, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :gbapplication_id, :integer         # Hidden 
  #     configure :category_id, :integer         # Hidden 
  #     configure :sort, :integer 
  #     configure :gbapp_specific, :integer 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Geo::AlnFnsApliwaMasslinieL do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :masstext, :string 
  #     configure :create_by, :string 
  #     configure :create_dat, :string 
  #     configure :change_by, :string 
  #     configure :change_dat, :string   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Geo::AlnFnsApliwaPflegeArchivF do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :liwaeingriff, :integer 
  #     configure :liwaeingriffjahr, :integer 
  #     configure :liwaeingriffsatus, :integer 
  #     configure :liwaauftrag, :string 
  #     configure :client_id, :string 
  #     configure :create_by, :string 
  #     configure :create_dat, :string 
  #     configure :change_by, :string 
  #     configure :change_dat, :string 
  #     configure :pflege_id, :string 
  #     configure :pflege_oid, :integer   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Geo::AlnFnsApliwaPflegeF do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :liwaeingriff, :integer 
  #     configure :liwaeingriffjahr, :integer 
  #     configure :liwaeingriffsatus, :integer 
  #     configure :liwaauftrag, :string 
  #     configure :client_id, :string 
  #     configure :create_by, :string 
  #     configure :create_dat, :string 
  #     configure :change_by, :string 
  #     configure :change_dat, :string 
  #     configure :pflege_id, :string 
  #     configure :pflege_oid, :integer   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Geo::AlnFnsBunKonstruktionP do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :client_id, :string 
  #     configure :create_by, :string 
  #     configure :create_dat, :string 
  #     configure :change_by, :string 
  #     configure :change_dat, :string   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Geo::AvzhHausnummerPosP do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :typ, :string 
  #     configure :beschriftung, :string 
  #     configure :posx, :float 
  #     configure :posy, :float 
  #     configure :ori, :float 
  #     configure :bfsnr, :integer 
  #     configure :refid, :string 
  #     configure :hali, :integer 
  #     configure :hali_txt, :string 
  #     configure :vali, :integer 
  #     configure :vali_txt, :string   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model GeometryColumn do
  #   # Found associations:
  #   # Found columns:
  #     configure :f_table_catalog, :string 
  #     configure :f_table_schema, :string 
  #     configure :f_table_name, :string 
  #     configure :f_geometry_column, :string 
  #     configure :coord_dimension, :integer 
  #     configure :srid, :integer 
  #     configure :type, :string   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Group do
  #   # Found associations:
  #     configure :users, :has_many_association 
  #     configure :roles, :has_and_belongs_to_many_association 
  #     configure :groups_users, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :name, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model GroupsUser do
  #   # Found associations:
  #     configure :group, :belongs_to_association 
  #     configure :user, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :group_id, :integer         # Hidden 
  #     configure :user_id, :integer         # Hidden 
  #     configure :granted, :boolean   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Layer do
  #   # Found associations:
  #     configure :sublayer_group, :belongs_to_association 
  #     configure :topics_layers, :has_many_association 
  #     configure :topics, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :name, :string 
  #     configure :wms_options, :text 
  #     configure :minscale, :integer 
  #     configure :maxscale, :integer 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime 
  #     configure :wms_url, :string 
  #     configure :layer_options, :text 
  #     configure :proxy_layer, :string 
  #     configure :wms_layers, :string 
  #     configure :table, :string 
  #     configure :style, :text 
  #     configure :title, :string 
  #     configure :topic_name, :string 
  #     configure :sublayer_group_id, :integer         # Hidden 
  #     configure :leg_sort, :integer 
  #     configure :wms_sort, :integer 
  #     configure :toc_sort, :integer 
  #     configure :geolion_gds, :integer 
  #     configure :pkey, :string 
  #     configure :visible, :boolean 
  #     configure :ident_fields, :text 
  #     configure :alias_fields, :text 
  #     configure :searchdistance, :integer   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Municipality do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :bfs, :integer 
  #     configure :arps, :integer 
  #     configure :bezirksname, :string 
  #     configure :art_text, :string 
  #     configure :gemeindename, :string 
  #     configure :art_code, :integer 
  #     configure :area_round, :float   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Organisation do
  #   # Found associations:
  #     configure :topics, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :title, :string 
  #     configure :sort, :integer 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Parcel do
  #   # Found associations:
  #   # Found columns:
  #     configure :geodb_oid, :integer 
  #     configure :objectid, :integer 
  #     configure :bfs, :integer 
  #     configure :gemeinde, :string 
  #     configure :bsname, :string 
  #     configure :gbnummer, :string 
  #     configure :bsori, :float 
  #     configure :lkx, :float 
  #     configure :lky, :float   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Permission do
  #   # Found associations:
  #     configure :role, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :role_id, :integer         # Hidden 
  #     configure :resource_type, :string 
  #     configure :resource, :string 
  #     configure :action, :string 
  #     configure :sequence, :integer 
  #     configure :deny, :boolean   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Role do
  #   # Found associations:
  #     configure :users, :has_and_belongs_to_many_association 
  #     configure :permissions, :has_many_association 
  #     configure :groups, :has_and_belongs_to_many_association 
  #     configure :access_filters, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :name, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model SublayerGroup do
  #   # Found associations:
  #     configure :layers, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :name, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model Topic do
  #   # Found associations:
  #     configure :children, :has_many_association 
  #     configure :organisation, :belongs_to_association 
  #     configure :bg_topic, :belongs_to_association 
  #     configure :overlay_topics, :has_and_belongs_to_many_association 
  #     configure :topics_layers, :has_many_association 
  #     configure :categories_topics, :has_many_association 
  #     configure :layers, :has_many_association 
  #     configure :categories, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :name, :string 
  #     configure :icon, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime 
  #     configure :map_config, :text 
  #     configure :settings, :serialized 
  #     configure :style, :text 
  #     configure :title, :string 
  #     configure :parent_id, :integer         # Hidden 
  #     configure :description, :text 
  #     configure :organisation_id, :integer         # Hidden 
  #     configure :background_layer, :boolean 
  #     configure :main_layer, :boolean 
  #     configure :overlay_layer, :boolean 
  #     configure :keywords, :string 
  #     configure :geolion_gdd_intranet, :integer 
  #     configure :geolion_gdd_internet, :integer 
  #     configure :image_format, :string 
  #     configure :print_title, :string 
  #     configure :sub_title, :string 
  #     configure :bgtopic, :integer 
  #     configure :ollayer_class, :string 
  #     configure :ollayer_args, :serialized 
  #     configure :bg_topic_id, :integer         # Hidden   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model TopicsLayer do
  #   # Found associations:
  #     configure :topic, :belongs_to_association 
  #     configure :layer, :belongs_to_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :topic_id, :integer         # Hidden 
  #     configure :layer_id, :integer         # Hidden 
  #     configure :position, :integer 
  #     configure :queryable, :boolean 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
  # config.model User do
  #   # Found associations:
  #     configure :groups, :has_many_association 
  #     configure :roles, :has_and_belongs_to_many_association 
  #     configure :groups_users, :has_many_association   #   # Found columns:
  #     configure :id, :integer 
  #     configure :login, :string 
  #     configure :name, :string 
  #     configure :email, :string 
  #     configure :password, :password         # Hidden 
  #     configure :password_confirmation, :password         # Hidden 
  #     configure :password_salt, :string         # Hidden 
  #     configure :reset_password_token, :string         # Hidden 
  #     configure :remember_token, :string         # Hidden 
  #     configure :remember_created_at, :datetime 
  #     configure :sign_in_count, :integer 
  #     configure :current_sign_in_at, :datetime 
  #     configure :last_sign_in_at, :datetime 
  #     configure :current_sign_in_ip, :string 
  #     configure :last_sign_in_ip, :string 
  #     configure :created_at, :datetime 
  #     configure :updated_at, :datetime   #   # Sections:
  #   list do; end
  #   export do; end
  #   show do; end
  #   edit do; end
  #   create do; end
  #   update do; end
  # end
end
