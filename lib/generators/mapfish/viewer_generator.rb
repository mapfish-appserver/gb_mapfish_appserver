require 'rails/generators'
module Mapfish
  module Generators
    class ViewerGenerator < Rails::Generators::Base
      class_option "name", :type => :string
      class_option "template", :type => :string, :default => 'gbzh'

      source_root File.expand_path("../../../js/viewers", __FILE__)

      def copy_viewer
        name = options["name"] || options["template"]
        puts "Copying viewer to 'public/apps/#{name}/..."
        directory options["template"], "public/apps/#{name}", :verbose => false
      end
    end
  end
end
