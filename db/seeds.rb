default_site = ENV['DEFAULT_SITE'] || 'localhost'
admin_password = ENV['ADMIN_PWD'] || '123456'

admin_role = Role.find_or_create_by_name('admin')
site_role = Role.find_or_create_by_name(default_site)

user = User.create!(:login => 'admin', :email => "admin@example.com", :password => admin_password, :password_confirmation => admin_password)
user.roles << admin_role

admin_role.permissions.create!(:sequence => 0,
:action => 'edit', :resource_type => 'Topic', :resource => '*')
admin_role.permissions.create!(:sequence => 0,
:action => 'show', :resource_type => 'Wms', :resource => '*')
admin_role.permissions.create!(:sequence => 0,
:action => 'show', :resource_type => 'Wfs', :resource => '*')
admin_role.permissions.create!(:sequence => 0,
:action => 'edit', :resource_type => 'Layer', :resource => '*/*')
admin_role.permissions.create!(:sequence => 0,
:action => 'edit', :resource_type => 'Attribute', :resource => '*/*')

#Default tools
['LineMeasureTool', 'AreaMeasureTool', 'PrevTool', 'NextTool', 'LinkTool', 'PrintTool'].each_with_index do |tool, i|
  site_role.permissions.create!(:sequence => i,
  :action => 'show', :resource_type => 'Tool', :resource => "*/#{tool}")
end

#Basic permissions for default site
site_role.permissions.create!(:sequence => 0,
:action => 'index', :resource_type => 'Topic', :resource => '*')
site_role.permissions.create!(:sequence => 0,
:action => 'show', :resource_type => 'Attribute', :resource => '*/*')
