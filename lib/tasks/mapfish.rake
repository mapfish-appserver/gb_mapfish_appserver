namespace :mapfish do

  require 'generators/mapfish/install/install_generator'

  task :seed_database => :environment do
    site = ENV['SITE']
    generator = Mapfish::Generators::InstallGenerator.new([], ["--default-site-name=#{site}"])
    generator.seed_database
  end

  namespace :viewer do

  require 'rails/generators'

  task :create => :environment do
    repo = ENV['repo']
    name = ENV['name']
    category = ENV['category'] || 'Uncategorized'
    Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--repo=#{repo}"]
    app = Gbapplication.find_or_create_by_name(name)
    category = Category.find_or_create_by_title(category)
    app.categories << category
  end

  task :register => :environment do
    name = ENV['name']
    category = ENV['category'] || 'Uncategorized'
    app = Gbapplication.find_or_create_by_name(name)
    default_category = Category.find_or_create_by_title(category)
    app.categories << default_category
  end

  end

end