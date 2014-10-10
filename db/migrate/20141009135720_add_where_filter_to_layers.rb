class AddWhereFilterToLayers < ActiveRecord::Migration
  def change
    add_column :layers, :where_filter, :string
  end
end
