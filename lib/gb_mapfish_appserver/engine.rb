require 'cancan'
require 'devise'
require 'rails_admin'

module GbMapfishAppserver
  class Engine < ::Rails::Engine
    engine_name "mapfish"
  end
end

SearchRule = Struct.new(:model, :fields, :alias_fields)

LocateRule = Struct.new(:model, :layer, :search_field)

