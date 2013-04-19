class SearchController < ApplicationController

  def index
    @rule =  SEARCHRULES[params[:rule]]
    result = @rule.model.query(@rule.fields, params)
    @features = result[:features]
    @quality = result[:quality]

    respond_to do |format|
      format.html # index.html.erb
      format.json { render :json => {:success => true, :features => features_for_json_reader(@features), :quality => @quality} }
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
