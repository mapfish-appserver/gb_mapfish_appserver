SITE_DEFAULT = '<%= options["default-site-name"] %>'

HOST_ZONE = {
  #'intra.maps.example.com'  => SITE_INTRANET,
}
HOST_ZONE.default = SITE_DEFAULT

#Hostnames in image links (e.g. identify symbol) which should be replaced by 127.0.0.1 for printing
LOCAL_GRAPHICS_HOST = /<%= options["default-site-name"] %>/

LOCAL_WMS = [
  %r(^127.0.0.1$),
  %r(^localhost$),
]

DEFAULT_TOPIC = {
  SITE_DEFAULT => (Topic.first rescue nil) #Topic.where(:name => 'MainMap').first
}

DEFAULT_SCALE = 310000
DEFAULT_X = 692000
DEFAULT_Y = 252000

# regex for WMS parameters to detect if layer filter is used
LAYER_FILTER_REGEX = /^filter_.+$/i
