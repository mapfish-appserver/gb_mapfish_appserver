#
# Copyright (C) 2008 Pirmin Kalberer, Sourcepole AG
#
# This file is part of MapFish Server
#
# MapFish Server is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# MapFish Server is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with MapFish Server.  If not, see <http://www.gnu.org/licenses/>.
#

module GbMapfishAppserver
  module Array

    def to_geojson(options = {})
      # get CRS from first feature
      if any? && first.respond_to?('geojson_srid')
        crs = first.geojson_srid
        # skip GeoJSON CRS in features
        options.merge!({:skip_feature_crs => true})
      end

      geojson = '{"type": "FeatureCollection", "features": ['
      geojson << collect {|e| e.to_geojson(options) }.join(',')
      geojson << ']'

      unless crs.blank?
        # add top level GeoJSON CRS
        geojson << ', "crs": '
        geojson << {
          :type => 'name',
          :properties => {
            :name => crs
          }
        }.to_json
      end

      geojson << '}'

      geojson
    end

  end
end

Array.class_eval do
  include GbMapfishAppserver::Array
end
