class Tool
  include ActiveModel::Validations

  ALL = ['LineMeasureTool', 'AreaMeasureTool',
    'PrevTool', 'NextTool', 'LinkTool', 'PrintTool',
    'ExportTool', 'SelectTool'] #, 'EditTool'

  validates_presence_of :topic, :name

  attr_accessor :topic, :name

  def initialize(topic, name)
    @topic, @name = topic, name
  end

  def self.accessible_tools(topic, ability)
    tools = ALL.select do |tool|
      ability.can?(:show, Tool.new(topic, tool))
    end
    tools << 'EditTool' if ability.can?(:edit, topic)
    tools
  end
end
