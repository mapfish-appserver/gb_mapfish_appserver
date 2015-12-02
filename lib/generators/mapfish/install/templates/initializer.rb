SITE_DEFAULT = '<%= options["default-site-name"] %>'

HOST_ZONE = {
  #'intra.maps.example.com'  => SITE_INTRANET,
}
HOST_ZONE.default = SITE_DEFAULT

# redirect app to HTTPS if user is logged in
REDIRECT_APP_TO_HTTPS_IF_SIGNED_IN = false

#Hostnames in image links (e.g. identify symbol) which should be replaced by 127.0.0.1 for printing
LOCAL_GRAPHICS_HOST = /<%= options["default-site-name"] %>/

#Hosts in WMS URLs, which should be called via MAPSERV_URL for printing
LOCAL_WMS = [
  %r(^<%= options["default-site-name"] %>$),
  %r(^127.0.0.1$),
  %r(^localhost$),
]

#Location for temporary mapfish-print files
#NOTE: use a shared directory for multi-node setups (e.g. NFS)
PRINT_TMP_PATH = "/tmp"

# scales and dpis for printing (optional)
#PRINT_SCALES = [500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 200000, 500000]
#PRINT_DPIS = [150, 300]

DEFAULT_TOPIC = {
  SITE_DEFAULT => (Topic.first rescue nil) #Topic.where(:name => 'MainMap').first
}

DEFAULT_SCALE = 310000
DEFAULT_X = 692000
DEFAULT_Y = 252000

# regex for WMS parameters to detect if layer filter is used
LAYER_FILTER_REGEX = /^filter_.+$/i

# Proxy for cascaded WMS Feature requests
# See also http://www.ruby-doc.org/stdlib-1.9.3/libdoc/net/http/rdoc/Net/HTTP.html#method-c-Proxy
CASCADED_PROXY_ADDR = nil #Ruby 2.0 supports :ENV for using http_proxy environment variable
CASCADED_PROXY_PORT = nil
CASCADED_PROXY_USER = nil
CASCADED_PROXY_PASS = nil
