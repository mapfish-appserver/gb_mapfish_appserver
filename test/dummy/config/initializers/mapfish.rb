SITE_DEFAULT = 'maps.example.com'

HOST_ZONE = {
  #'intra.maps.example.com'  => SITE_INTRANET,
}
HOST_ZONE.default = SITE_DEFAULT

# redirect app to HTTPS if user is logged in
REDIRECT_APP_TO_HTTPS_IF_SIGNED_IN = false

#Hostnames in image links (e.g. identify symbol) which should be replaced by 127.0.0.1 for printing
LOCAL_GRAPHICS_HOST = /maps.example.com/

#Hosts in WMS URLs, which should be called via MAPSERV_URL for printing
LOCAL_WMS = [
  %r(^maps.example.com$),
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

# set default spatial reference system of database for geo factory
GeoModel.set_default_rgeo_factory(RGeo::Cartesian.factory(:srid => 21781, :proj4 => '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs'))
# set default spatial reference system for client requests
GeoModel.set_default_client_srid(21781)

DEFAULT_SCALE = 310000
DEFAULT_X = 692000
DEFAULT_Y = 252000
DEFAULT_ZOOM = 4

# regex for WMS parameters to detect if layer filter is used
LAYER_FILTER_REGEX = /^filter_.+$/i

# Proxy for cascaded WMS Feature requests
# See also http://www.ruby-doc.org/stdlib-1.9.3/libdoc/net/http/rdoc/Net/HTTP.html#method-c-Proxy
CASCADED_PROXY_ADDR = nil #Ruby 2.0 supports :ENV for using http_proxy environment variable
CASCADED_PROXY_PORT = nil
CASCADED_PROXY_USER = nil
CASCADED_PROXY_PASS = nil
