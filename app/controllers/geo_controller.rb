class GeoController < ApplicationController

  skip_before_filter :verify_authenticity_token

  def geo_model
    throw NotImplementedError
  end

  def index
    client_srid = params[:srid].blank? ? geo_model.default_client_srid : params[:srid].to_i

    @features = geo_model.bbox_filter(params)
    @features = @features.user_filter(current_ability)
    respond_to do |format|
      # NOTE: return GeoJSON by default (OpenLayers.Protocol.HTTP PUT does not work with '.json' format selection)
      format.html {
        render :json => @features.json_filter.select_geojson_geom(client_srid).to_geojson
      }
      format.csv {
        send_csv_excel(@features.csv_filter)
      }
    end
  end

  def show
    client_srid = params[:srid].blank? ? geo_model.default_client_srid : params[:srid].to_i

    @feature = geo_model.user_filter(current_ability).json_filter.select_geojson_geom(client_srid).find(params[:id])
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
      else
        head :unprocessable_entity
        return
      end
    end

    render :json => @features.to_geojson, :status => :created
  end

  def update
    # NOTE: user_filter checks if model is editable
    feature = geo_model.user_filter(current_ability).geojson_decode(request.raw_post)
    if feature.nil?
      head :bad_request
      return
    end

    if feature.feature_id.is_a? Integer
      # NOTE: user_filter may limit editable features; find raises RecordNotFound if feature cannot be found
      @feature = geo_model.user_filter(current_ability).find(feature.feature_id)
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

  def send_csv_excel(features)
    require 'csv'

    # add byte order mark and use CRLF row breaks for Excel
    bom = "\xEF\xBB\xBF"
    csv_data = CSV.generate(bom, {:write_headers => true, :col_sep => ";", :row_sep => "\r\n"}) do |csv|
      csv << features.first.csv_header unless features.empty?
      features.each do |adresse|
        csv << adresse.csv_row
      end
    end

    send_data(csv_data, :filename => "features_#{geo_model.table_name}.csv", :type => 'text/csv; header=present')
  end

end
