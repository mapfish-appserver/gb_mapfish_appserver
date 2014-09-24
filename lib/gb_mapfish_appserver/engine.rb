require 'cancan'
require 'devise'
require 'rails_admin'

module GbMapfishAppserver
  class Engine < ::Rails::Engine
    engine_name "mapfish"

    require 'geo_ruby'
  end
end

SearchRule = Struct.new(:model, :fields, :alias_fields)
