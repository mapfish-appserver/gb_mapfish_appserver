namespace :mapfish do

  namespace :viewer do

  require 'rails/generators'

  task :create => :environment do
    repo = ENV['repo']
    name = ENV['name']
    Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--repo=#{repo}"]
    app = Gbapplication.find_or_create_by_name(name)
    default_category = Category.find_or_create_by_title('Uncategorized')
    app.categories << default_category 
  end

  end

end