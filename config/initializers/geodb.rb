config_path = File.join(Rails.root,'config','geodatabase.yml')

db_conf = {}
if File.exist?(config_path)
  db_conf = YAML.load(ERB.new(File.read(config_path)).result)
end

GEODB = db_conf[Rails.env]

puts "Warning: No geodb configuration found in #{config_path}" if GEODB.nil?