# NOTE: mark user values with "$user.<attribute>$", e.g. "$user.bfsnr$"

class AccessFilter < ActiveRecord::Base
  belongs_to :role

  attr_protected []

  scope :for_roles, lambda { |roles| where(:role_id => roles.collect(&:id)) }

  def parse_condition
    if ["WMS", "WFS"].include?(resource_type)
      wms_condition = condition
      begin
        # try to parse as JSON
        wms_condition = JSON.parse(wms_condition)
      rescue => err
        Rails.logger.info "Could not parse #{resource_type} condition for #{role.name} #{resource} as JSON: #{err}"
      end
      wms_condition
    else
      condition
    end
  end

  def self.user_value(user, value)
    # replace "$user.<attribute>$" placeholders with user.app_infos[<attribute>] values
    user_attributes = value.to_s.scan(/\$user\.(\w+)\$/).flatten
    unless user_attributes.empty?
      if user.nil?
        # empty values if no user
        value.sub(/\$user\.(\w+)\$/, '')
      else
        user_attributes.each do |key|
          # replace placeholder with value from user.app_infos
          value.sub!(/\$user\.#{key}\$/, user.app_infos[key] || '')
        end
        value
      end
    else
      value
    end
  end

end
