class UploadController < ApplicationController

  # return GPX file content enclosed in JSON response
  def gpx
    if user_signed_in?
      uploaded_io = params[:gpx_file]
      if uploaded_io.tempfile.size <= 1048576
        # NOTE: use content type "text/html" for file upload response
        #       see http://docs.sencha.com/ext-js/4-0/#!/api/Ext.form.Basic-method-hasUpload
        render :text => CGI::escapeHTML({:success => true, :gpx => uploaded_io.read, :filename => uploaded_io.original_filename}.to_json)
      else
        render :text => CGI::escapeHTML({:success => false, :msg => "File size must be less than 1MB"}.to_json)
      end
    else
      render :nothing => true, :status => 404
    end
  end

end
