class SearchController < ApplicationController

  def index
    @rule =  SEARCHRULES[params[:rule]]
    if @rule.nil? then
      respond_to do |format|
        format.html # index.html.erb
        format.json { render :json => {:success => false,  :quality => -9999, :msg => "ERROR: #{params[:rule]} model missing"} }
      end
    else
      result = @rule.model.query(@rule.fields, params)
      @features = result[:features]
      @quality = result[:quality]
      @success = @quality >= 0 

      respond_to do |format|
        format.html # index.html.erb
        if @success then
          format.json { render :json => {:success => @success, :features => features_for_json_reader(@features), :quality => @quality} }
        else
          @msg = result[:msg]
          format.json { render :json => {:success => @success, :features => features_for_json_reader(@features), :quality => @quality, :msg => @msg} }
        end
      end
    end
  end

  def locate
    rule = LOCATERULES[params[:rule]]
    if rule.nil?
      render :json => {:success => false, :msg => "ERROR: #{params[:rule]} model missing"}
    else
      location = rule.locate(params['locations'])
      unless location.nil?
        location[:success] = true
        render :json => location
      else
        render :json => {:success => false, :msg => "No features found"}
      end
    end
  end

  def soap_wsdl
    render "#{params[:rule]}_wsdl.xml"
  end

  def soap
    soap_action = nil
    soap_params = nil
    if params[:Envelope] && params[:Envelope][:Body]
      params[:Envelope][:Body].each do |key, value|
        soap_action = key
        soap_params = value
      end
    end

    if soap_action.nil? || soap_params.nil?
      # TODO: error response
      render :xml => "Invalid SOAP request"
      return
    end

    @rule =  SEARCHRULES[params[:rule]]
    result = @rule.model.soap_query(@rule.fields, soap_params, soap_action)
    if result[:error]
      #TODO: error response
      render :xml => result[:error]
    else
      @feature = result[:feature]
      @hits = result[:hits]
      @quality = result[:quality]
      @features = result[:features]
      render result[:template]
    end
  end

  private

  def features_for_json_reader(features)
    # convert feature list for display in grid panel:
    #
    # features.to_json result:
    # [
    #   {"featureclass":
    #     {"att1":"value1", "att2":"value2"}
    #   }
    # ]
    #
    # expected JSON format:
    # [
    #   {"att1":"value1", "att2":"value2"}
    # ]

    list = []
    features.each do |feature|
      list << feature.attributes
    end
    list
  end

end
