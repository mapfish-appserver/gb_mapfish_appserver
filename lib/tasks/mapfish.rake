namespace :mapfish do

  namespace :viewer do

  require 'rails/generators'

  task :create => :environment do
    repo = ENV['repo']
    name = ENV['name']
    Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--repo=#{repo}"]
    app = Gbapplication.find_or_create_by_name(name)
    category = Category.find_or_create_by_title(ENV['category'] || 'Uncategorized')
    app.categories << category
  end

  task :register => :environment do
    name = ENV['name']
    category = ENV['category'] || 'Uncategorized'
    #Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--template=#{template}"]
    app = Gbapplication.find_or_create_by_name(name)
    default_category = Category.find_or_create_by_title(category)
  end

  end

end