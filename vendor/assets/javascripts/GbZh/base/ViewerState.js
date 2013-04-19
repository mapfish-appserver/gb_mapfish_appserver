Ext.define('GbZh.base.ViewerState', {
	mixins: {
		observable: 'Ext.util.Observable'
	},
	//	requires: ['GbZh.store.Topics', 'GbZh.store.Layers'],
	// topicStore: GbZh.store.Topics,
	// wmsLayerStore: GbZh.store.Layers,
	singleton: true,

	// request-Sachen
	currentTopic: {},
	currentTopicRecord: {},
	requestedTopic: 'ImmoRegView',
	activeTopic: 'BASISKARTEZH',
	// default topic from server
	activeTopicTitle: '',
	// default topic from server
	//	backgroundlayers: ['voidLayer','swisstopoTiles'],
	//	activebackgroundlayer: 'voidLayer',
	offLayers: [],
	mapScale: 200000,
	mapPos: [null, null],
	selection: null,
	serverUrl: null,
	appUrl: null,
//	geoLionHost: 'http://160.63.9.152',
//	geoLionHost: 'http://cbd300320',
	geoLionHost: 'http://www.geolion.ktzh.ch/',
	gbApplication: 'default',
	filter: {
		filtertopic: '',
		filterlayer: '',
		filtersql: ''
	},
	redlining: '',
	//
	config: {
		requestState: null,
		currentMap: null
	},


	applyRequestState: function (requestState) {
		if (requestState) {
			this.requestedTopic = requestState.requestedTopic || this.requestedTopic;
//HACK
			this.activeTopic = requestState.requestedTopic || requestState.activeTopic || this.activeTopic;
//			this.activeTopic = requestState.activeTopic || this.activeTopic;
			this.activeTopicTitle = requestState.requestedTopicTitle;
//			this.activeTopicTitle = requestState.activeTopicTitle || this.activeTopicTitle;
			this.filter = requestState.filter || this.filter;
			this.mapScale = requestState.mapScale || this.mapScale;
			this.mapPos = requestState.mapPos || this.mapScale;
			this.selection = requestState.selection || this.selection;
			this.redlining = requestState.redlining || this.redlining;

			//HACK
			this.serverUrl = location.protocol + "//" + location.host;
			this.appUrl = location.href;

		}
		return requestState;
	},

	constructor: function () {
		this.addEvents({
			'topicselected': true,
			//Params: {name: 'GB-ARPStand', title:'...', overlay: false}
			'wmslayerstoreloaded': true,
			//Params: {name: 'GB-ARPStand', title:'...', overlay: false}
			'dotopicstoreload': true,
			//Params: {requestedTopicName}
			'resetOlMap': true,
			//Params: none
			'identifytoggled': true,
			// Params: enabled
			'identifyclicked': true,
			//Params: 'images/identify_marker.png', clickPosition.lon, clickPosition.lat
			'dologin': true,
			//Params: none
			'dologout': true,
			//Params: none
			'userchanged': true,
			//Params: user
			'mapscalechanged': true,
			//Params: scale
			'loadended': true,
			//Params: none
			'loadstarted': true,
			//Params: none
			'featuresselected': true,
			// Params: topicName, layer, property, values[]
			'searchresultselected': true,
			// Params: markerImg, posX, posY, mapScale
			'searchresultselectedrectangle': true,
			// Params: markerImg, posXw, posYs, posXe, posYn, mapScale
			'printactivate': true,
			// Params: none
			'printdeactivated': true,
			// Params: none
			'redliningactivate': true,
			// Params: setActive
                        'redliningpermalinkupdate': true,
                        // Params: features von GbZh.widgets.RedliningPanel
                        'redliningpermalinkfeaturesadd': true,
                        // Params: features für GbZh.widgets.RedliningPanel
			'linkactivate': true,
			// Params: none
			'editactivate': true,
			// Params: editLayers für GbZh.widgets.FeatureEditPanel
			'exportactivate': true,
			// Params: exportLayers für GbZh.widgets.FeatureExportPanel
			'printextenttoggled': true,
			// Params: (Printpanel visible?)
			// wird obsolet werden (Hilfsevents für GridPanel)
			'topicgroupcategory': true,
			'topicgrouporganisation': true,
			'topicgroupalphabet': true,
			'pagechanged': true,
			'insertmetadata': true,
			// Params: GeoLion-ID (gds)
//			'showmetadata': true,
			'printLegend': true,
			//Params: gdsnr
			'collapseall': true,
			'expandall': true
		});
		Ext.util.Observable.capture(this, function (e, params) {
			//LOG console.log('ViewerState-event: ' + e);
			if (typeof (params) === 'object') {
				//LOG console.log(params);
			}
		});
		this.on('wmslayerstoreloaded', this.setCurrentTopic, this);

		// show redlining from permalink after first topic load
		this.on('loadended', this.showRedliningPermalink, this);
                // update redlining permalink on redlining changes
		this.on('redliningpermalinkupdate', this.setRedliningPermalink, this);
/*		
		Ext.util.Observable.prototype.fireEvent =
			Ext.Function.createInterceptor(Ext.util.Observable.prototype.fireEvent, function() {
				if (arguments[0].indexOf('mouse') >= 0) return;
				if (arguments[0].indexOf('uievent') >= 0) return;
				if (arguments.length > 1) {
					//LOG console.log(arguments[1].id + ": ");
				}
				//LOG console.log(arguments);
			});
*/
			
/* 			Ext.util.Observable.capture(
    Ext.getCmp('print'),
    function(e) {
        console.info("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        console.info(e);
    }
);
 */
//Ext.util.Observable.prototype.fireEvent =Ext.Function.createInterceptor(Ext.util.Observable.prototype.fireEvent, function() {...});

		// Ext.util.Observable.prototype.fireEvent =
			// Ext.util.Observable.prototype.fireEvent.createInterceptor(function() {
			// //LOG console.log("+*+*+*+ " + this.name);
			// //LOG console.log(arguments);
		// return true;
		// });
	},

	setCurrentTopic: function (topic) {
		this.currentTopic = topic;
	},

	showFeatures: function (layer, property, values, minx, miny, maxx, maxy, maxZoom) {
//TODO Versuch, einen vernünftigen Zoom zu erhalten. Verbesserungsfähig.
		var mind = 250;
		minx = parseFloat(minx);
		miny = parseFloat(miny);
		maxx = parseFloat(maxx);
		maxy = parseFloat(maxy);
		if (maxx - minx < (2.0 * mind)) {
			var meanx = (maxx + minx) / 2.0;
			minx = meanx - mind;
			maxx = meanx + mind;
		}
		if (maxy - miny < (2.0 * mind)) {
			var meany = (maxy + miny) / 2.0;
			miny = meany - mind;
			maxy = meany + mind;
		}
		// features bounds
		var bounds = new OpenLayers.Bounds(minx, miny, maxx, maxy);

		// zoom out a bit
		var zoom = this.map.getZoomForExtent(bounds, false) * 0.95;

		// clamp to min scale
		if (zoom > maxZoom) {
			zoom = maxZoom;
		}

		// zoom to features
		this.map.setCenter(bounds.getCenterLonLat(), zoom);

		// store selection params
		if (this.selection === null) {
			this.selection = {};
		}
		this.selection.seltopic = this.currentTopic.name;
		this.selection.sellayer = layer;
		this.selection.selproperty = property;
		this.selection.selvalues = values;

		// select features
		this.showSelection();
	},

	showSelection: function () {
		this.fireEvent('featuresselected', this.selection.seltopic, this.selection.sellayer, this.selection.selproperty, this.selection.selvalues);
		Ext.getCmp('seloffbtn').show();

		// TODO (alt): multiselect from permalink?
	},

	// set redlining features as permalink param
	setRedliningPermalink: function(redlining) {
		this.redlining = redlining;
	},

	// convert permalink param to redlining features
	showRedliningPermalink: function() {
		if (this.redlining) {
			this.fireEvent('redliningactivate', false);
			this.fireEvent('redliningpermalinkfeaturesadd', this.redlining);
		}

		// show redlining from permalink only after first topic load
		this.un('loadended', this.showRedliningPermalink, this);
	},

	permalink: function () {
        var params = {
            topic: this.currentTopic.name,
//            offlayers: this.wmsLayerStore.getOffLayersParam(this.currentTopic.name),
            offlayers: GbZh.store.WmsLayers.getOffLayersParam(this.currentTopic.name),

            scale: Ext.util.Format.round(this.map.getScale(), 0),
            x: Ext.util.Format.round(this.map.getCenter().lon, 2),
            y: Ext.util.Format.round(this.map.getCenter().lat, 2)
        };

        if (this.selection !== null) {
            params.seltopic = this.selection.seltopic;
            params.sellayer = this.selection.sellayer;
            params.selproperty = this.selection.selproperty;
            params.selvalues = this.selection.selvalues.join('$');
        }

	// Redlining
	if (this.redlining != null) {
		params.redlining = this.redlining;
	}

//HACK Startpunkt der Applikation
 //       return Ext.urlAppend(this.appUrl, Ext.urlEncode(params));
        return Ext.urlAppend(this.serverUrl, Ext.urlEncode(params));
    }







	//	CLASS_NAME: "GbZh.base.ViewerState"
/* GbZH.GbEventManager.addEvents('topicstoreloaded'); // ()
GbZH.GbEventManager.addEvents('topicselected'); // (GbZH.Topic)
// WmsLayerStore
GbZH.GbEventManager.addEvents('wmslayerstoreloaded'); // (GbZH.Topic)
GbZH.GbEventManager.addEvents('wmslayerstorevisibilitychanged'); // (topicName, layers)
// OlLayerManager
GbZH.GbEventManager.addEvents('mapscalechanged'); // (scale)
GbZH.GbEventManager.addEvents('layerorderchanged'); // (layer, layerIndex)
GbZH.GbEventManager.addEvents('layerremoved'); // (layer)
// LoginWindow
GbZH.GbEventManager.addEvents('loginsuccess'); // ()
// Search
GbZH.GbEventManager.addEvents('searchresultselected'); // (markerImg, posX, posY, mapScale)
// InfoPanel / FeatureQuery
GbZH.GbEventManager.addEvents('identifyclicked'); // (markerImg, posX, posY)
// Selection
GbZH.GbEventManager.addEvents('featuresselected'); // (topicName, layer, property, values[])
GbZH.GbEventManager.addEvents('selectioncleared'); // ()
// Layer filter
GbZH.GbEventManager.addEvents('layerfilterchanged'); // (topicName, layer, filterId)
// PrintPanel
GbZH.GbEventManager.addEvents('printextenttoggled'); // (visible)
 */
});