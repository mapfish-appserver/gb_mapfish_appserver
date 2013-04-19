class Permission < ActiveRecord::Base
  belongs_to :role

  attr_protected []

  validates :role, :presence => true
  validates :resource_type, :presence => true
  validates :resource, :presence => true
  validates :action, :presence => true
  validates :sequence, :presence => true

  #Base class for ResourceTypes with permissions
  class ResourceType

    @@resource_types = {}

    def initialize(klass, resource_type_name)
      @klass = klass
      @resource_type_name = resource_type_name
      @@resource_types[@klass] = self
    end

    def self.for_class(klass)
      @@resource_types[klass]
    end

    # Available actions
    def actions
      []
    end

    # ActiveRecord collection of all resources (e.g. Layer.scoped)
    # Override to enable accessible_by scopes
    def resources
      nil
    end

    def has_resource_list?
      not resources.nil?
    end

    # Comparison of ActiveModel object and permission resource string
    def compare(resource_object, resource_name)
      resource_name == '*' || resource_object.name == resource_name
    end

    def role_can?(role_id, action, resource)
      can = if has_resource_list?
        permitted_resources(role_id, action).include?(resource)
      else
        permitted?(resource, permissions(role_id, action))
      end
      Rails.logger.debug ">>>>>>>>>>>>>>>>>> role_can? role_id: #{role_id}, action: #{action}, resource: #{resource.name} -> #{can}"
      can
    end

    def roles_permissions(roles, action, resource = nil)
      p = []
      roles.each do |role|
        perms = permissions(role.id, action)
        #ok = permitted?(resource, perms)
        p += perms
      end
      p
    end

    def roles_can?(roles, action, resource)
      roles.find { |role| role_can?(role.id, action, resource) }
    end

    def add_ability(ability, roles)
      actions.each do |action|
        if has_resource_list?
          ids = Rails.cache.fetch("permitted_resource_ids-#{action}-#{@resource_type_name}-roles-#{roles.collect(&:id).join(',')}") do
            permitted_resource_ids(roles, action)
          end
          Rails.logger.debug ">>>>>>>>>>>> permitted_resource_ids with roles #{roles.collect(&:name).join(',')} can? #{action} #{@resource_type_name}: #{ids.inspect}"
          ability.can(action, @klass, :id => ids) unless ids.empty?
        else
          ability.can(action, @klass) do |attr|
            roles_can?(roles, action, attr)
          end
        end
      end
    end

    protected

    def permitted?(resource, permissions)
      allow = false
      permissions.each do |permission|
        if permission.deny
          allow = false if compare(resource, permission.resource)
        else
          allow ||= compare(resource, permission.resource)
        end
      end
      allow
    end

    #All resource permissionsfor a given role_id + action
    def permitted_resources(role_id, action)
      permissions = permissions(role_id, action)
      resources.select do
        |r| permitted?(r, permissions)
      end
    end

    #All permitted resources (ids) for given roles and a action
    def permitted_resource_ids(roles, action)
      ids = []
      return ids if !has_resource_list?
      roles.each { |role| ids += permitted_resources(role.id, action).collect(&:id) }
      ids.sort.uniq
    end

    #All permissions for a given role_id + action
    def permissions(role_id, action)
      Permission.where(:role_id => role_id,
        :resource_type => @resource_type_name, :action => action).order(
        'resource_type,role_id,sequence').all
    end
  end


  # For RailsAdmin form
  def name
    "#{resource_type} #{deny ? '-' : '+'}#{action} #{resource}"
  end

end
