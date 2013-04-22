require 'rails/generators'
module Mapfish
  module Generators
    class ViewerGenerator < Rails::Generators::Base
      class_option "name", :type => :string, :required => true
      class_option "repo", :type => :string, :required => true

      source_root File.expand_path("../templates", __FILE__)

      def clone_viewer
        @viewer = options["name"]
        puts "Cloning viewer..."
        dir = Dir.mktmpdir
        begin
          git :clone => "--depth=1 #{options['repo']} #{dir}"
          Dir.glob("#{dir}/*").each do |fn|
            if File.directory?(fn)
              name = File.basename(fn).sub(/.+?(build)?$/, "#{@viewer}\\1")
              puts "Copy viewer to 'public/apps/#{name}/..."
              directory fn, "public/apps/#{name}", :verbose => false
              if File.directory?("#{fn}/.sencha")
                #TODO: replace app name in .sencha/app/sencha.cfg
                directory "#{fn}/.sencha", "public/apps/#{name}/.sencha", :verbose => false
              end
            end
          end
        ensure
          FileUtils.rm_rf dir
        end
      end

      def generate_viewer_html
        @viewer = options["name"]
        dest = "app/views/apps/#{@viewer}.html.erb"
        template "viewer.html.erb", dest
        puts "Please adapt javascript and css references in '#{dest}'"
      end
    end
  end
end
