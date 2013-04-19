namespace :mapfish do

  namespace :viewer do

  require 'rails/generators'

  task :create => :environment do
    template = ENV['template'] || 'gbzh'
    name = ENV['name'] || template
    Rails::Generators.invoke 'mapfish:viewer', ["--name=#{name}", "--template=#{template}"]
    app = Gbapplication.find_or_create_by_name(template)
    default_category = Category.find_or_create_by_title('Uncategorized')
    app.categories << default_category 
  end

  end

end