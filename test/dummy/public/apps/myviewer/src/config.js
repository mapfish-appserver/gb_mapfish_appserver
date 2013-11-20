/**
 * Custom configuration
 */

Config = {};

// flag to activate debug code
Config.debug = false;


// data configuration
Config.data = {};

Config.data.topicsUrl = "/topics.json?gbapp=myviewer";

Config.data.layersUrl = function(topicName) {
  return "/layers.json?topic=" + topicName;
}

Config.data.initialTopic = "naturalearth";


// feature info
Config.featureInfo = {};

// feature info format ('text/xml' or 'text/html')
Config.featureInfo.format = 'text/html';

// enable this to use WMS GetFeatureInfo requests
Config.featureInfo.useWMSGetFeatureInfo = false;

/**
 * custom feature info URL when not using WMS GetFeatureInfo
 *
 * topicName: current topic
 * coordinate: clicked position as [x, y]
 * layers: array of visible WMS layer names
 */
Config.featureInfo.url = function(topicName, coordinate, layers) {
  return "/topics/query?" + $.param({
    bbox: [coordinate[0], coordinate[1], coordinate[0], coordinate[1]].join(','),
    infoQuery: '{"queryTopics":[{"topic":"' + topicName + '","divCls":"legmain","layers":"' + layers.join(',') + '"}]}',
    mobile: 1
  });
}


// map configuration
Config.map = {};

// ol.Extent
Config.map.extent = [-180, -90, 180, 90];

// ol.View2DOptions
Config.map.viewOptions = {
  projection: 'EPSG:4326',
  center: [0, 0],
  zoom: 2
};

Config.map.wmsParams = {
  'FORMAT': 'image/png; mode=8bit',
  'TRANSPARENT': null
};

Config.map.useTiledBackgroundWMS = true;

// DPI for scale calculations
Config.map.dpi = 96;

// limit max zoom to this scale (e.g. minScaleDenom=500 for 1:500)
Config.map.minScaleDenom = {
  map: 1000, // if topic.minscale is not set
  geolocation: 10000, // on location following
  search: 10000 // jump to search results
};


// search configuration
Config.search = {};

// append this to the query string to limit search results e.g. to a canton ("ZH")
Config.search.queryPostfix = "";
