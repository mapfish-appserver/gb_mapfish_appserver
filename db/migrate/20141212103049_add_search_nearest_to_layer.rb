class AddSearchNearestToLayer < ActiveRecord::Migration
  def change
    add_column :layers, :search_nearest, :boolean, :default => false
  end
end
