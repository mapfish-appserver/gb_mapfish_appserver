require 'rgeo-activerecord' # required by activerecord-postgis-adapter

::RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)
