require 'cancan'
require 'devise'

# workaround for using safe_yaml < 1.0.4 with Psych instead of syck to avoid side-effects on YAML behaviour of other gems
# see also https://github.com/dtao/safe_yaml/commit/25e2e156371f8846e7e1918a9e216e89473c57f8
require 'yaml'
if !defined?(YAML::ENGINE) && defined?(Psych) && YAML == Psych
  module YAML
    # define temporary dummy YAML::ENGINE.yamler to init SafeYAML::YAML_ENGINE with 'psych'
    # see also https://github.com/dtao/safe_yaml/blob/0.9.7/lib/safe_yaml.rb#L6
    class DummyEngine
      def self.yamler
        "psych"
      end
    end
    ENGINE = DummyEngine
    require 'safe_yaml'

    # remove YAML::ENGINE
    remove_const :ENGINE
  end
end

require 'rails_admin'

module GbMapfishAppserver
  class Engine < ::Rails::Engine
    engine_name "mapfish"

    require 'geo_ruby'
  end
end

SearchRule = Struct.new(:model, :fields, :alias_fields)
