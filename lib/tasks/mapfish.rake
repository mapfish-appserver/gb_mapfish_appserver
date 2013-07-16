namespace :mapfish do

  namespace :viewer do

  task :register => :environment do
    name = ENV['name']
    category = ENV['category'] || 'Uncategorized'
    #Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--template=#{template}"]
    app = Gbapplication.find_or_create_by_name(name)
    default_category = Category.find_or_create_by_title(category)
    app.categories << default_category 
  end

  end

end