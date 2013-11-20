# This migration comes from mapfish (originally 20130118151946)
class SetupMapfishTables < ActiveRecord::Migration
  def up
    create_table "access_filters", :force => true do |t|
      t.integer "role_id",       :null => false
      t.string  "resource_type", :null => false
      t.string  "resource",      :null => false
      t.text    "condition",     :null => false
    end

    create_table "categories", :force => true do |t|
      t.string   "title"
      t.text     "description"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    create_table "categories_topics", :force => true do |t|
      t.integer  "category_id"
      t.integer  "topic_id"
      t.integer  "sort"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    add_index "categories_topics", ["category_id"], :name => "index_categories_topics_on_category_id"
    add_index "categories_topics", ["sort"], :name => "index_categories_topics_on_sort"
    add_index "categories_topics", ["topic_id"], :name => "index_categories_topics_on_topic_id"

    create_table "gbapplications", :force => true do |t|
      t.string   "name"
      t.string   "title"
      t.text     "description"
      t.integer  "sort"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    add_index "gbapplications", ["sort"], :name => "index_gbapplications_on_sort"

    create_table "gbapplications_categories", :force => true do |t|
      t.integer  "gbapplication_id"
      t.integer  "category_id"
      t.integer  "sort"
      t.integer  "gbapp_specific"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    add_index "gbapplications_categories", ["category_id"], :name => "index_gbapplications_categories_on_category_id"
    add_index "gbapplications_categories", ["gbapp_specific"], :name => "index_gbapplications_categories_on_flag"
    add_index "gbapplications_categories", ["gbapplication_id"], :name => "index_gbapplications_categories_on_gbapplication_id"
    add_index "gbapplications_categories", ["sort"], :name => "index_gbapplications_categories_on_sort"

    create_table "groups", :force => true do |t|
      t.string   "name"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    create_table "groups_roles", :id => false, :force => true do |t|
      t.integer "group_id"
      t.integer "role_id"
    end

    create_table "groups_users", :force => true do |t|
      t.integer "group_id"
      t.integer "user_id"
      t.boolean "granted",  :default => false
    end

    create_table "layers", :force => true do |t|
      t.string   "name"
      t.integer  "minscale"
      t.integer  "maxscale"
      t.datetime "created_at"
      t.datetime "updated_at"
      t.string   "table"
      t.text     "selection_style"
      t.string   "title"
      t.string   "topic_name"
      t.integer  "sublayer_group_id"
      t.integer  "geolion_gds"
      t.string   "pkey"
      t.text     "ident_fields"
      t.text     "alias_fields"
      t.integer  "searchdistance"
    end

    add_index "layers", ["sublayer_group_id"], :name => "index_layers_on_sublayer_group_id"
    add_index "layers", ["topic_name"], :name => "index_layers_on_topic_name"

    create_table "organisations", :force => true do |t|
      t.string   "title"
      t.integer  "sort"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    create_table "permissions", :force => true do |t|
      t.integer "role_id",                          :null => false
      t.string  "resource_type",                    :null => false
      t.string  "resource",                         :null => false
      t.string  "action",                           :null => false
      t.integer "sequence",                         :null => false
      t.boolean "deny",          :default => false
    end

    create_table "rails_admin_histories", :force => true do |t|
      t.string   "message"
      t.string   "username"
      t.integer  "item"
      t.string   "table"
      t.integer  "month",      :limit => 2
      t.integer  "year",       :limit => 8
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    add_index "rails_admin_histories", ["item", "table", "month", "year"], :name => "index_histories_on_item_and_table_and_month_and_year"

    create_table "roles", :force => true do |t|
      t.string   "name"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    create_table "roles_users", :id => false, :force => true do |t|
      t.integer "role_id"
      t.integer "user_id"
    end

    create_table "sublayer_groups", :force => true do |t|
      t.string   "name"
      t.datetime "created_at"
      t.datetime "updated_at"
    end

    create_table "topics", :force => true do |t|
      t.string   "name"
      t.datetime "created_at"
      t.datetime "updated_at"
      t.string   "title"
      t.integer  "parent_id"
      t.integer  "organisation_id"
      t.boolean  "background_layer"
      t.boolean  "main_layer"
      t.boolean  "overlay_layer"
      t.text     "keywords"
      t.integer  "geolion_gdd_intranet"
      t.integer  "geolion_gdd_internet"
      t.string   "print_title"
      t.string   "sub_title"
      t.integer  "bg_topic_id"
      t.string   "ollayer_class",        :default => "WMS", :null => false
      t.text     "ollayer_args"
      t.integer  "minscale"
    end

    add_index "topics", ["background_layer"], :name => "index_topics_on_base_layer"
    add_index "topics", ["main_layer"], :name => "index_topics_on_main_layer"
    add_index "topics", ["name"], :name => "index_topics_on_name"
    add_index "topics", ["organisation_id"], :name => "index_topics_on_organisation_id"
    add_index "topics", ["overlay_layer"], :name => "index_topics_on_overlay_layer"
    add_index "topics", ["parent_id"], :name => "index_topics_on_parent_id"

    create_table "topics_layers", :force => true do |t|
      t.integer  "topic_id"
      t.integer  "layer_id"
      t.integer  "wms_sort"
      t.boolean  "queryable"
      t.datetime "created_at"
      t.datetime "updated_at"
      t.integer  "leg_sort"
      t.integer  "toc_sort"
      t.boolean  "visini"
    end

    create_table "topics_topics", :id => false, :force => true do |t|
      t.integer "topic_id"
      t.integer "overlay_topic_id"
    end

    create_table "users", :force => true do |t|
      t.string   "login"
      t.string   "name"
      t.string   "email",                                 :default => "", :null => false
      t.string   "encrypted_password",     :limit => 128, :default => "", :null => false
      t.string   "password_salt",                         :default => "", :null => false
      t.integer  "sign_in_count",                         :default => 0
      t.datetime "current_sign_in_at"
      t.datetime "last_sign_in_at"
      t.string   "current_sign_in_ip"
      t.string   "last_sign_in_ip"
      t.datetime "created_at"
      t.datetime "updated_at"
      t.string   "confirmation_token"
      t.datetime "confirmed_at"
      t.datetime "confirmation_sent_at"
      t.string   "reset_password_token"
      t.datetime "reset_password_sent_at"
      t.datetime "remember_created_at"
      t.integer  "failed_attempts",                       :default => 0
      t.string   "unlock_token"
      t.datetime "locked_at"
      t.string   "authentication_token"
      t.string   "invitation_token"
      t.text     "app_infos"
      t.integer  "app_filter_id"
    end

    add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  end
end
