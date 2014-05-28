class GeoController < ApplicationController

  skip_before_filter :verify_authenticity_token

  def geo_model
    throw NotImplementedError
  end

  def index
    @features = geo_model.bbox_filter(params)
    @features = @features.user_filter(current_ability)
    respond_to do |format|
      # NOTE: return GeoJSON by default (OpenLayers.Protocol.HTTP PUT does not work with '.json' format selection)
      format.html {
        render :json => @features.json_filter.to_geojson
      }
      format.csv {
        send_csv_excel(@features.csv_filter)
      }
    end
  end

  def show
    @feature = geo_model.user_filter(current_ability).json_filter.find(params[:id])
    render :json => [@feature].to_geojson
  end

  def create
    @features = []
    feature_collection = geo_model.geojson_decode(request.raw_post)
    if feature_collection.nil? || !geo_model.can_edit?(current_ability)
      head :bad_request
      return
    end

    feature_collection.each do |feature|
      if feature.feature_id.is_a? Integer
        new_feature = geo_model.find(feature.feature_id)
      end
      if new_feature.nil?
        new_feature = geo_model.new
      end

      logger.info "#{geo_model.table_name}.update_attributes_from_feature: #{feature.inspect}"
      if new_feature.update_attributes_from_geojson_feature(feature, current_user)
        @features << new_feature
      end
    end

    render :json => @features.to_geojson, :status => :created
  end

  def update
    feature = geo_model.user_filter(current_ability).geojson_decode(request.raw_post)
    if feature.nil?
      head :bad_request
      return
    end

    if feature.feature_id.is_a? Integer
      @feature = geo_model.find(feature.feature_id)
    end
    if @feature.nil?
      head :not_found
      return
    end

    if @feature.update_attributes_from_geojson_feature(feature, current_user)
      render :json => @feature.to_geojson, :status => :created
    else
      head :unprocessable_entity
    end
  end

  def destroy
    @feature = geo_model.user_filter(current_ability).find(params[:id])
    @feature.destroy
    head :no_content
  end

  private

  # http://blog.plataformatec.com.br/2009/09/exporting-data-to-csv-and-excel-in-your-rails-app/
  BOM = "\377\376" #Byte Order Mark

  def send_csv_excel(features)
    require 'csv'
    require 'iconv'
    export = StringIO.new
    if features.size > 0
      CSV::Writer.generate(export, "\t") do |csv|
        csv << features.first.csv_header
        features.each do |obj|
          csv << obj.csv_row
        end
      end
      export.rewind
    end
    csv_data = export.read
    csv_data = BOM + Iconv.conv("utf-16le", "utf-8", csv_data)
    send_data(csv_data, :filename => "features_#{geo_model.table_name}.csv", :type => 'text/csv; header=present')
  end

end
