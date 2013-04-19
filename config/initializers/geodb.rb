config_path = File.join(Rails.root,'config','geodatabase.yml')

db_conf = File.exist?(config_path) ? YAML::load(File.open(config_path)) : {}
 
GEODB = db_conf[Rails.env]

puts "Warning: No geodb configuration found in #{config_path}" if GEODB.nil?