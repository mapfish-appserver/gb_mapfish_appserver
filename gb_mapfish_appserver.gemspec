$:.push File.expand_path("../lib", __FILE__)

require "gb_mapfish_appserver/version"

Gem::Specification.new do |s|
  s.name        = "gb_mapfish_appserver"
  s.version     = GbMapfishAppserver::VERSION
  s.authors     = ["Pirmin Kalberer"]
  s.email       = ["pka@sourcepole.ch"]
  s.homepage    = ""
  s.summary     = "Mapfish application server."
  s.description = "Mapfish Appserver is a framework for web mapping applications using OGC standards and the Mapfish protocol."

  s.files = Dir["{app,config,db,lib,vendor}/**/*"] + ["LICENSE", "Rakefile", "README.rst"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "~> 3.2.13"
  s.add_dependency "json"
  s.add_dependency "acts_as_tree", "0.2.0"

  s.add_dependency "devise", "2.0.4"
  s.add_dependency "cancan", "1.6.7"

  s.add_dependency "rails_admin", "0.0.5"
  s.add_dependency "fastercsv"# required for rails_admin and Ruby <= 1.8

  s.add_dependency "rgeo", "0.3.20"
  s.add_dependency "rgeo-geojson", "0.2.1"

  s.add_dependency "pg", "0.14.0"
  s.add_dependency "activerecord-postgis-adapter", "0.4.1"
end
