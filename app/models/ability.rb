class Ability
  include CanCan::Ability

  attr_reader :ability_roles


  class Roles
    attr_reader :roles

    def initialize(user, zone = nil)
      @roles = []

      #Runtime roles
      zone ||= SITE_DEFAULT
      @roles << Role.find_by_name(zone)

      user ||= User.new # guest user (not logged in)
      @roles += user.roles
      user.groups.each { |group| @roles += group.roles }
      @roles.sort!.uniq!
    end

    def has_role?(rolename)
      roles.any? { |role| role.name == rolename.to_s }
    end
  end

  class TopicResourceType < Permission::ResourceType

    def initialize
      super(Topic, 'Topic')
    end

    def actions
      [
        :index, #display in TOC, but needs login for viewing
        :show,  #Full WebGIS access (implies [:index])
        :edit   #Edit in admin backend or spatial editing (implies [:index, :show])
      ]
    end

    def resources
      Topic.select("id,name")
    end

  end

  # ----------

  class WmsResourceType < Permission::ResourceType

    def initialize
      super(Wms, 'Wms')
    end

    def actions
      [
        :show  #WMS access
      ]
    end

  end

  # ----------

  class WfsResourceType < Permission::ResourceType

    def initialize
      super(Wfs, 'Wfs')
    end

    def actions
      [
        :show  #WFS access
      ]
    end

  end

  # ----------

  class LayerResourceType < Permission::ResourceType

    def initialize
      super(Layer, 'Layer')
    end

    def actions
      [
        :show,  #Full WebGIS access
        :edit,  #Edit in admin backend or spatial editing (implies [:show, :legend, :query])
        :legend, # Show legend (implies [:show])
        :query  #Allow identify/search (implies [:show])
      ]
    end

    def resources
      Layer.select("id,name")
    end

    def compare(resource_object, resource_name)
      topic, layer = resource_name.split('/')
      if topic == '*'
        if layer == '*'
          true
        else
          resource_object.name == layer
        end
      else
        if layer == '*'
          layer_topics_lookup[resource_object.id].include?(topic)
        else
          resource_object.name == layer && layer_topics_lookup[resource_object.id].include?(topic)
        end
      end
    end

    private

    def layer_topics_lookup
      #Build a lookup hash for all layer -> topic relations
      @layer_topics ||= begin
        layer_topics = resources.all.inject({}) {|hsh,l| hsh[l.id] = []; hsh }        
        # layer_topics = resources.inject({}) {|hsh,l| hsh[l.id] = []; hsh }
        all_topics = Topic.select("topics.id,topics.name,layers.id,layers.name").includes(:layers)
        all_topics.each {|t| t.layers.each {|l| layer_topics[l.id] << t.name} }
        layer_topics
      end
    end

  end

  # ----------

  class AttributeResourceType < Permission::ResourceType

    def initialize
      super(::Attribute, 'Attribute')
    end

    def actions
      [
        :show,  #Full WebGIS access
        :edit  #Edit in admin backend or spatial editing (implies [:show])
      ]
    end

    def compare(resource_object, resource_name)
      layer, attribute = resource_name.split('/')
      if layer == '*'
        if attribute == '*'
          true
        else
          resource_object.name == attribute
        end
      else
        if attribute == '*'
          resource_object.layer.name == layer
        else
          resource_object.name == attribute && resource_object.layer.name == layer
        end
      end
    end

  end

  # ----------

  class ToolResourceType < Permission::ResourceType

    def initialize
      super(Tool, 'Tool')
    end

    def actions
      [
        :show  #Tool access
      ]
    end

    def compare(resource_object, resource_name)
      topic, attribute = resource_name.split('/')
      if topic == '*'
        if attribute == '*'
          true
        else
          resource_object.name == attribute
        end
      else
        if attribute == '*'
          resource_object.topic.name == topic
        else
          resource_object.name == attribute && resource_object.topic.name == topic
        end
      end
    end
  end

  # ----------

  class GroupResourceType < Permission::ResourceType

    def initialize
      super(Group, 'Group')
    end

    def actions
      [
        :edit   #Edit group memberships in admin backend
      ]
    end

    def resources
      Group.scoped
    end

  end

  # ----------

  def initialize(ability_roles)
    # The first argument to `can` is the action you are giving the user permission to do.
    # If you pass :manage it will apply to every action. Other common actions here are
    # :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on. If you pass
    # :all it will apply to every resource. Otherwise pass a Ruby class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, :published => true
    #
    # See the wiki for details: https://github.com/ryanb/cancan/wiki/Defining-Abilities

    #Anwendungsfälle
    #* Unterschied Intranet vs. Internet --> unterschiedliche Anzahl Topics
    #* Intranet: Anmeldung mit Login --> zusätzliche Topics, die normaler Intranet User nicht sehen kann.
    #* Applikationen, die in Topic-Liste für alle sichtbar sind, es ist aber ein Login erforderlich (Schlüssel-Icons)um Karte zu wechseln.
    #* Applikationen, die in Topic-Liste nur sichtbar sind nach erfolgreichem Login.
    #* Neophyten-Applikation:
    #- Versch. Kantone --> Unterschiedlicher Start-Extent, Unterschiedliche Hintergrund-Layers
    #- Rollen: Basiserfasser (kann nur eigene Einträge editieren), Verifikator (darf seine und Einträge von Basiserfasser editieren), Experte (darf seine und Einträge von Basiserfasser und von Experte editieren),  Administrator kann alle Einträge editieren und hat Zugriff auf Benutzerverwaltung des eigenen Kantons.
    #* Applikation Fachstelle Bodenschutz:
    #- Gemeinde-User darf nur Einträge innerhalb seiner Gemeinde sehen, Administrator darf alle Einträge sehen.
    #
    #Ressourcen-Typen
    #* Topics: a/b
    #* Layers: a/b/c
    #* Attribute (Zeigen/Verbergen von Feldern bei Info-Abfragen): a/b/c
    #* Widgets (z.B. Verhindern des Druckens, Verstecken von Möglichkeiten): a
    #* Teile eines Widgets (z.B. Unterdrückung einzelner Formularfelder, Aktivierungsmöglichkeiten von Buttons und Optionen): a/b
    #* Tools (Knöpfe auf Toolbars): a/b
    #* (?) einzelne Funktionalitäten (z.B. Einschränkung Massstabsbereich, Map-Extent) (via Filter?)
    #
    #Actions
    #* Status: hidden / visible (a) --- disabled / enabled (b) --- edit (c)
    #* Action: index --- show --- edit
    #* Bsp. Neophyten: rollenspezifische Filter (SQL): Selektion z.B. erfasste Punkte nur von Benutzer XY

    #Default aliases (https://github.com/ryanb/cancan/wiki/Action-Aliases)
    #alias_action :index, :show, :to => :read
    #alias_action :new, :to => :create
    #alias_action :edit, :to => :update
    #Custom aliases:
    alias_action :index, :to => :show #Show implies index permissions
    alias_action :index, :show, :legend, :query, :to => :edit #Edit implies index and show permissions
    alias_action :legend, :query, :to => :show #Show implies legend and query permissions

    @ability_roles = ability_roles
    if @ability_roles.has_role?(:admin)
      can :manage, :all
      #https://github.com/sferik/rails_admin/wiki/CanCan
      can :access, :rails_admin
      can :dashboard
    else
      #can :change_password, User, _id => @user.id #TODO: allow edit password

      #Topic permissions
      TopicResourceType.new.add_ability(self, roles)

      #WMS permissions
      WmsResourceType.new.add_ability(self, roles)

      #WFS permissions
      WfsResourceType.new.add_ability(self, roles)

      #Layer permissions
      LayerResourceType.new.add_ability(self, roles)

      #Attribute permissions
      AttributeResourceType.new.add_ability(self, roles)

      #Group permissions
      GroupResourceType.new.add_ability(self, roles)

      #Attribute permissions
      ToolResourceType.new.add_ability(self, roles)
    end

    #Access filters: { resource_type => { resource => filter } }
    #@access_filters = {}
    #AccessFilter.for_roles(roles).each do |access_filter|
    #  @access_filters[access_filter.resource_type] ||= {}
    #  rtaf = @access_filters[access_filter.resource_type]
    #  res = access_filter.resource.split('/').last
    #  rtaf[res] = access_filter.condition
    #end
  end

  def roles
    @ability_roles.roles
  end

  def user_permissions(action, resource)
    resource_type = Permission::ResourceType.for_class(resource.class)
    resource_type.roles_permissions(roles, action, resource)
  end

  #def resource_access_filter(resource)
  #  rtaf = @access_filters[resource.class.to_s]
  #  return nil if rtaf.nil?
  #  rtaf[resource.table]
  #end
end
