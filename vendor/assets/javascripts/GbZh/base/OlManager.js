Ext.define('GbZh.base.OlManager', {
	extend: 'Ext.util.Observable',
	requires: ['GbZh.base.ViewerState', 'GbZh.model.Topic', 'GbZh.store.Topics', 'GbZh.model.WmsLayer', 'GbZh.store.WmsLayers'],
	singleton: true,

	map: null,
	topicStore: null,
	wmsLayerStore: null,
	markerLayer: null,
	selectionLayer: null,
    identifyControl: null,
	lineControl: null,
	areaControl: null,
	nav: null,
	measuredLength: 0.0,
	backgroundInitialized: false,

	constructor: function () {
		this.topicStore = GbZh.store.Topics;
		//XXX als Singleton wird der topicStore schon am Anfang geladen
		//		this.topicStore.loadTopics();
		this.wmsLayerStore = GbZh.store.WmsLayers;

		GbZh.base.ViewerState.on('wmslayerstoreloaded', this.addTopicLayer, this);
        GbZh.base.ViewerState.addListener('identifytoggled', this.toggleIdentify, this);
		GbZh.base.ViewerState.addListener('identifyclicked', this.showIdentifyMarker, this);
		GbZh.base.ViewerState.addListener('wmslayerstorevisibilitychanged', this.updateTopicLayers, this);
		GbZh.base.ViewerState.addListener('featuresselected', this.showSelection, this);
		GbZh.base.ViewerState.addListener('searchresultselected', this.showSearchResult, this);
		GbZh.base.ViewerState.addListener('searchresultselectedrectangle', this.showSearchResultRect, this);

		this.measuredLength = 0.0;
		// OL events weiterleiten
		// this.map.events.on({changelayer: this.layerChanged, scope: this});
		// this.map.events.on({removelayer: this.layerRemoved, scope: this});
	},


	clearOverlayLayers: function () {
		var i;
		this.checkMap();
		// do not clear initial selection after startup (only background base layer in map)
		if (this.selectionLayer !== null && this.map.layers.length > 1) {
			this.selectionLayer = null;
		}

		// remove overlay layers
		for (i = this.map.layers.length - 1; i >= 0; i--) {
			if (!this.map.layers[i].isBaseLayer) {
				this.map.removeLayer(this.map.layers[i]);
			}
		}
		this.markerLayer = null;
	},


	addBackgroundLayers: function () {
		if (this.backgroundInitialized) {
			return;
		}
//TODO Sowas gibt's schon bei der MapComponent: wo jetzt? hier oder dort?

		// this.map.addLayer(new OpenLayers.Layer.WMS('kein Hintergrund', {
			// isBaseLayer: true,
			// maxExtent: this.map.maxExtent,
			// minScale: this.map.minScale || 700000
		// }));

/*
			config.layer_options.isBaseLayer = true;
			config.layer_params.layers = 'dtm';
			config.layername = 'DTM';
			var basisLayer = this.buildLayer(config);
			config.layer_params.layers = 'orthoaktuell';
			config.layername = 'Luftbild';
			var basisLayer2 = this.buildLayer(config);
			this.map.addLayer(basisLayer);
			this.map.addLayer(basisLayer2);	},
 */

//HACK hier muss unbedingt die richtige URL für Intranet bzw. Internet verwendet werden ...
		var backgroundUrl = 'http://wms.zh.ch/basis';
		var wmsLayerParams = {
			transparent: false,
			version: '1.3.0',
			map_resolution: OpenLayers.DOTS_PER_INCH,
			format: "image/jpeg"
		};
		var olLayerOptions = {
			displayInLayerSwitcher: true,
			visibility: true,
			projection: new OpenLayers.Projection("EPSG:21781"),
			units: 'm',
			attribution: '',
			isBaseLayer: true,
			opacity: 1,
			//singleTile: true,
			ratio: 1.0,
			transitionEffect: 'resize',
			topic: 'basis'
		};
		var layer;

		wmsLayerParams.layers = 'orthophotos';
		olLayerOptions.layername = 'Luftbild';
		layer = new OpenLayers.Layer.WMS('Luftbild', backgroundUrl, wmsLayerParams, olLayerOptions);
		this.map.addLayer(layer);

		wmsLayerParams.layers = 'dtm';
		olLayerOptions.layername = 'DTM';
		layer = new OpenLayers.Layer.WMS('Geländemodell', backgroundUrl, wmsLayerParams, olLayerOptions);
		this.map.addLayer(layer);

		this.map.setBaseLayer(this.map.getLayersByName('Geländemodell')[0]); //Default background layer
		this.backgroundInitialized = true;
	},

	addOlLayer: function (config) {
		this.checkMap();
		////LOG console.log(GbZh.store.Topics);
		//HACK
		this.addBackgroundLayers();
		if (config !== null) {
			//			//LOG console.log(config);
                        //set singleTile when changing topic
            config.layer_options.singleTile = this.singleTileLayer(this.map.getScale());
			var layer = this.buildLayer(config);
			this.map.addLayer(layer);
			// initial map extent
			if (this.map.getExtent() === null) {
				this.map.zoomToMaxExtent();
			}
		}
	},

	addTopicLayer: function (topic) {
		//LOG console.log("addTopicLayer" + topic.name);
		if (!topic.overlay) {
			this.clearOverlayLayers();
		}

		var config = this.topicStore.wmsConfig(topic);

		this.addOlLayer(config);

		// add initial selection layer after startup
		if (this.selectionLayer !== null && this.selectionLayer.map === null) {
			this.map.addLayer(this.selectionLayer);
		}
	},

	buildSpecialControls: function () {
		var sketchSymbolizers = {
			"Point": {
				pointRadius: 5,
				graphicName: "circle",
				fillColor: "red",
				fillOpacity: 0.1,
				strokeWidth: 1,
				strokeOpacity: 1,
				strokeColor: "#FF0000"
			},
			"Line": {
				strokeWidth: 2,
				strokeOpacity: 1,
				strokeColor: "#FF0000",
				strokeDashstyle: "dash"
			},
			"Polygon": {
				strokeWidth: 2,
				strokeOpacity: 1,
				strokeColor: "#FF0000",
				fillColor: "yellow",
				fillOpacity: 0.3
			}
		};
		var style = new OpenLayers.Style();
		style.addRules([
			new OpenLayers.Rule({
				symbolizer: sketchSymbolizers
			})]);
		var styleMap = new OpenLayers.StyleMap({
			"default": style
		});

		var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
		renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

		this.lineControl = new OpenLayers.Control.Measure(
			OpenLayers.Handler.Path,
			{
				persist: true,
				handlerOptions: {
					layerOptions: {
						renderers: renderer,
						styleMap: styleMap
					}
				}
			}
		);
		this.lineControl.events.on({
			"measure": this.handleMeasurements,
			"measurepartial": this.handleMeasurements
		});

		this.areaControl = new OpenLayers.Control.Measure(
			OpenLayers.Handler.Polygon,
			{
				persist: true,
				handlerOptions: {
					layerOptions: {
						renderers: renderer,
						styleMap: styleMap
					}
				}
			}
		);
		this.areaControl.events.on({
			"measure": this.handleMeasurements,
			"measurepartial": this.handleMeasurements
		});

		this.nav = new OpenLayers.Control.NavigationHistory();
	},


	buildLayer: function (config) { //FIXME: duplicate function in OlLayerManager
		config = config || {};
		config.layer_params = config.layer_params || {};
		config.layer_options = config.layer_options || {};

		var topic = config.topic || "";
		var layers = config.layer_params.layers || this.wmsLayerStore.getlayersparam(topic);

		var wmsLayerParams = {
			//           layers: layers.split(',').reverse().join(','),
			layers: layers,
			version: '1.3.0',
			map_resolution: OpenLayers.DOTS_PER_INCH,
			transparent: config.layer_params.transparent || true, //FIXME: always true!
			format: 'image/png; mode=8bit' //config.layer_params.format || "image/gif"
		};
		var olLayerOptions = {
			layername: config.layername,
			displayInLayerSwitcher: true,
			visibility: true,
			projection: config.layer_options.projection || new OpenLayers.Projection("EPSG:21781"),
			units: 'm',
			attribution: config.layer_options.attribution || '',
			//maxExtent: new OpenLayers.Bounds(config.layer_options.bounds || 660000, 220000, 725000, 285000),
			//extent: maxExtent,
			//maxScale: config.layer_options.maxscale || 1,
			//minScale: config.layer_options.minscale || 700000,
			isBaseLayer: config.layer_options.isBaseLayer || false,
			opacity: config.layer_options.opacity || 1,
			singleTile: config.layer_options.singleTile,
            ratio: 1.0,
			transitionEffect: 'resize',
			// custom properties
			topic: topic
		};

		var wms = new OpenLayers.Layer.WMS(
			config.layername,
			config.wms_url,
			wmsLayerParams,
			olLayerOptions
		);

		wms.events.on({
			loadstarted: this.loadStarted,
			loadend: this.loadEnded,
			scope: this
		});
		return wms;
	},

//	buildBasisLayer: function (config) {
//		config = config || {};
//		config.layer_params = config.layer_params || {};
//		config.layer_options = config.layer_options || {};
//
//		var topic = "basis";
//		var layers = 'dtm,orthophotos';
//
//		var wmsLayerParams = {
//			//           layers: layers.split(',').reverse().join(','),
//			layers: layers,
//			transparent: false,
//			format: "image/jpeg"
//		};
//		var olLayerOptions = {
//			layername: 'Basis',
//			displayInLayerSwitcher: true,
//			visibility: true,
//			projection: new OpenLayers.Projection("EPSG:21781"),
//			units: 'm',
//			attribution: '',
//			//maxExtent: new OpenLayers.Bounds(config.layer_options.bounds || 660000, 220000, 725000, 285000),
//			//extent: maxExtent,
//			//maxScale: config.layer_options.maxscale || 1,
//			//minScale: config.layer_options.minscale || 700000,
//			isBaseLayer: true,
//			opacity: config.layer_options.opacity || 1,
//			singleTile: config.layer_options.singleTile || true,
//                      ratio: 1.0,
//			transitionEffect: 'resize',
//			// custom properties
//			topic: topic
//		};
//
//		return new OpenLayers.Layer.WMS(
//			'Basis',
//			'http://web.wms.zh.ch/basis',
//			wmsLayerParams,
//			olLayerOptions
//		);
//	},

	showSelection: function (topicName, layer, property, values) {
		// remove existing selection layer
		this.clearSelection();

		// get WMS url for topic
		//        var topic = new GbZH.Topic({
		var topic = {
			name: topicName,
			title: 'Selection',
			overlay: false
		};
		var wmsConfig = this.topicStore.wmsConfig(topic);
		if (wmsConfig !== null) {
			// create and add selection layer
			var selection = {
				wms_url: wmsConfig.wms_url,
				layerName: layer,
				filterProperty: property,
				filterValues: values
			};
			this.selectionLayer = this.buildSelectionLayer(selection);
			// add selection layer to map if topic layer has been loaded
			if (this.map !== null && this.map.layers.length > 1) {
				this.map.addLayer(this.selectionLayer);

				// marker on top
				if (this.markerLayer !== null) {
					this.map.setLayerIndex(this.markerLayer, this.map.getNumLayers());
				}
			}
		}
	},

	clearSelection: function () {
		if (this.selectionLayer !== null) {
			this.map.removeLayer(this.selectionLayer);
			this.selectionLayer = null;
		}
		Ext.getCmp('seloffbtn').hide();
	},

	buildSelectionLayer: function (selection) {
		return new OpenLayers.Layer.WMS("Selection", selection.wms_url, {
			layers: selection.layerName,
			format: "image/gif",
			transparent: true,
			// custom params
			"selection[layer]": selection.layerName,
			"selection[property]": selection.filterProperty,
			"selection[values]": selection.filterValues.join(',')
		}, {
			isBaseLayer: false,
			singleTile: true,
			opacity: 0.6
		});
	},

/*   applyFilter: function(topicName, layer, filterId) {
        var olLayers = this.map.getLayersBy('topic', topicName);
        if (olLayers.length > 0)
        {
            // DEBUG: clear filter on id = 0
            var clearFilter = (filterId == 0);

            var filterParams = {};
            filterParams["filter[" + layer + "]"] = clearFilter ? null : filterId;
            olLayers[0].mergeNewParams(filterParams);
        }
    },
*/
	updateTopicLayers: function (topic, layers) {
		//		layers = layers.split(',').reverse().join(',');
		var olLayers = this.map.getLayersBy('topic', topic);
		if (olLayers.length > 0) {
			olLayers[0].mergeNewParams({
				layers: layers
			});
			// hide layer if no sublayers are visible
			olLayers[0].setVisibility(layers !== "");
		}
	},

	showMarker: function (markerImg, posX, posY) {
		var i;
		if (this.markerLayer === null) {
			this.markerLayer = new OpenLayers.Layer.Markers("Markers");
			this.map.addLayer(this.markerLayer);
		} else {
			this.map.setLayerIndex(this.markerLayer, this.map.getNumLayers());
			// remove existing markers
			for (i = this.markerLayer.markers.length - 1; i >= 0; i--) {
				this.markerLayer.removeMarker(this.markerLayer.markers[i]);
			}
		}

		// add marker
		var size = new OpenLayers.Size(40, 40);
		var offset = new OpenLayers.Pixel(-(size.w / 2), -(size.h / 2));
		var icon = new OpenLayers.Icon(markerImg, size, offset);
		this.markerLayer.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(posX, posY), icon));
	},

	showSearchResult: function (markerImg, posX, posY, mapScale) {
		this.showMarker(markerImg, posX, posY);

		// zoom to marker
		this.map.zoomToExtent(this.markerLayer.getDataExtent());
		if (this.map.getScale() < mapScale) {
			this.map.zoomToScale(mapScale);
		}
	},

	showSearchResultRect: function (markerImg, posXw, posYs, posXe, posYn, mapScale) {
		var xCenter = (posXw + posXe) / 2.0;
		var yCenter = (posYs + posYn) / 2.0;
		this.map.setCenter(new OpenLayers.LonLat(xCenter, yCenter));
		if (markerImg !== '') {
			this.showMarker(markerImg, xCenter, yCenter);
		}

		if ((posXe - posXw) > 0 && (posYn - posYs) > 0) {
			this.map.zoomToExtent(new OpenLayers.Bounds(posXw, posYs, posXe, posYn), true);
		} else {
			GbZh.base.ViewerState.fireEvent('searchresultselected', markerImg, posXw, posYs, mapScale);
		}
	},

    toggleIdentify: function (enabled) {
		if (enabled) {
			this.identifyControl.activate();
		} else {
			this.identifyControl.deactivate();
		}
	},

	showIdentifyMarker: function (posX, posY) {
		this.showMarker('/images/identify_marker.png', posX, posY);
		// Ext.getCmp('info').hidden = false;
		Ext.getCmp('info').show();
		Ext.getCmp('infotabpanel').setActiveTab('info');

	},

    tileSize: new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH, OpenLayers.Map.TILE_HEIGHT),

	singleTileLayer: function (scale) {
		return ((scale + 0.00005) % 100000 > 0.0001 || (scale + 0.00005) < 200000); //TODO: check default layers on
	},

	onScaleUpdate: function (scale) {
		var i, len;
		//LOG console.log("onScaleUpdate scale: " + scale);
		var singleTile = this.singleTileLayer(scale);
		var map = GbZh.base.ViewerState.getCurrentMap();
		for (i = 0, len = map.layers.length; i < len; i++) {
			var layer = map.layers[i];
			if (layer.url && layer.name !== "Selection") {
				if (layer.singleTile !== singleTile) {
					layer.singleTile = singleTile;
					//LOG console.log('layer: ' + layer.name + ' singleTile: ' + layer.singleTile);
					layer.clearGrid();
					if (singleTile) {
						layer.setTileSize();
					} else {
						layer.setTileSize(this.tileSize);
					}
				}
				if (!layer.singleTile) {
					//LOG console.log('Cache layer: ' + layer.name);
					layer.params.tc = 1;
				} else {
					layer.params.tc = 0;
				}
			}
		}
	},

	loadStarted: function () {
		GbZh.base.ViewerState.fireEvent('loadstarted');
	},
	loadEnded: function () {
		GbZh.base.ViewerState.fireEvent('loadended');
	},
/*
    layerChanged: function(event) {
        if (event.property == 'order')
        {
            GbZH.GbEventManager.fireEvent('layerorderchanged', event.layer, event.object.getLayerIndex(event.layer));
        }
    },
    
    layerRemoved: function(event) {
        GbZH.GbEventManager.fireEvent('layerremoved', event.layer);
    },

*/
	navNext: function () {
		this.nav.next.trigger();
	},

	navPrevious: function () {
		this.nav.previous.trigger();
	},

	toggleMeasureLength: function (btn) {
		if (btn.pressed) {
			//TODO: check using the new OL-Version 
			this.lineControl.activate();
			if (this.lineControl.setImmediate !== undefined) {
				this.lineControl.setImmediate(true);
			}
			this.measuredLength = 0.0;
		} else {
			this.lineControl.deactivate();
			Ext.get('measureresults').hide();

		}
	},

	toggleMeasureArea: function (btn) {
		if (btn.pressed) {
			this.areaControl.activate();
			if (this.areaControl.setImmediate !== undefined) {
				this.areaControl.setImmediate(true);
			}
		} else {
			this.areaControl.deactivate();
			Ext.get('measureresults').hide();
		}

	},

	handleMeasurements: function (event) {
		Ext.get('measureresults').show();
		var geometry = event.geometry;
		var units = event.units;
		var order = event.order;
		var measure = event.measure;
		var element = Ext.DomQuery.selectNode('#measureresults');
		var out = "";
		if (order === 1) { // Längen
			// if (units === 'xm') {
			// measure = measure / Math.pow(1000.0, order);
			// units = 'km';
			// }
			out += "Länge: " + measure.toFixed(3) + " " + units;
		} else { // Flächen
			out += "Fläche: " + measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
		}
		element.innerHTML = out;
		//		//LOG console.log(out);
	},

	checkMap: function () {
		this.map = GbZh.base.ViewerState.getCurrentMap();
	},

	createZhMap: function () {
		this.buildSpecialControls();

		this.identifyControl = new OpenLayers.Control.FeatureQuery({
			protocol: new OpenLayers.Protocol.HTTP({
				format: new OpenLayers.Format.Raw()
			}),
			url: GbZh.base.ViewerState.requestState.serverUrl + 'topics/query',
			//					viewerState: GbZh.base.ViewerState,
			autoActivate: true,
			toggle: true,
			clickTolerance: 0,
			outputNode: '#info-body'
		});

		var mapOptions = {
			controls: [
				new OpenLayers.Control.Navigation({documentDrag: true}),
				new OpenLayers.Control.PanZoom(),
//				new OpenLayers.Control.ZoomPanel({autoActivate: true}),
//				new OpenLayers.Control.ZoomPanel(),
				new OpenLayers.Control.KeyboardDefaults(),

//				new OpenLayers.Control.LayerSwitcher(),
                this.identifyControl,
				this.lineControl,
				this.areaControl,
				this.nav
			],
			maxExtent: new OpenLayers.Bounds(660000, 220000, 725000, 285000),
			minScale: 700000,
			maxScale: 1,
			units: 'm',
			projection: 'EPSG:21781',
			theme: null,
			fractionalZoom: true
		};
		//		lineControl.activate();
		//LOG console.log("mapOptions");
		//LOG console.log(mapOptions);
		//      return new OpenLayers.Map('gbzhmap', mapOptions);
		var mapZh = new OpenLayers.MapZh(mapOptions);
		mapZh.events.on({
			scaleUpdate: this.onScaleUpdate,
			scope: this
		});
		return mapZh;
	},

	createZhStaticMap: function () {
		this.buildSpecialControls();
		var mapZhS = new OpenLayers.Map('map');
		mapZhS.fractionalZoom = true; // beliebiger Massstab
		//scale=16419, w=640, h=412, Koord=686003/252851
		var s = 16419;
		var w = 640;
		var h = 412;
		var cx = 686003;
		var cy = 252851;
		var lonW, latH;
		lonW = w * 2.54 / 7200 * s;
		latH = h * 2.54 / 7200 * s;

		var options = {
			//numZoomLevels: 7,
			projection: new OpenLayers.Projection("EPSG:21781"),
			units: 'm'
		};

		var graphic = new OpenLayers.Layer.Image('LK', '../../lib/GBZH.ux/examples/data/images/img-karten/6012-160831-16419-3289-640-412-686003-252851.gif', new OpenLayers.Bounds(cx - lonW / 2, cy - latH / 2, cx + lonW / 2, cy + latH / 2), new OpenLayers.Size(640, 412), options);

		mapZhS.addLayers([graphic]);
		mapZhS.addControl(new OpenLayers.Control.MousePosition());
		mapZhS.zoomToMaxExtent();

		return mapZhS;
	},

	createBlueMarbleMap: function () {
		return new OpenLayers.Map({
			allOverlays: true,
			layers: [new OpenLayers.Layer.WMS("Global Imagery",
			//"http://labs.metacarta.com/wms/vmap0",
			//	{layers: "basic"}
				"http://maps.opengeo.org/geowebcache/service/wms", {
					layers: "bluemarble"
				})],
			controls: [
				new OpenLayers.Control.Navigation(),
				new OpenLayers.Control.PanZoom(),
				new OpenLayers.Control.KeyboardDefaults(),
				new OpenLayers.Control.Scale(),
				new OpenLayers.Control.LayerSwitcher()],
			center: new OpenLayers.LonLat(8, 47),
			zoom: 8
		});
	},

	createGoogleMap: function () {
		this.buildSpecialControls();
		var mapg = new OpenLayers.Map('googlemap', {
			controls: [
				new OpenLayers.Control.Navigation(),
				new OpenLayers.Control.PanZoom(),
				new OpenLayers.Control.KeyboardDefaults(),
				new OpenLayers.Control.LayerSwitcher(),
				this.lineControl,
				this.areaControl,
				this.nav]
		});

		var gphy = new OpenLayers.Layer.Google("Google Physical", {
			type: google.maps.MapTypeId.TERRAIN
		});
		var gmap = new OpenLayers.Layer.Google("Google Streets", {
			numZoomLevels: 20
		});
		var ghyb = new OpenLayers.Layer.Google("Google Hybrid", {
			type: google.maps.MapTypeId.HYBRID,
			numZoomLevels: 20
		});
		var gsat = new OpenLayers.Layer.Google("Google Satellite", {
			type: google.maps.MapTypeId.SATELLITE,
			numZoomLevels: 22
		});

		mapg.addLayers([gphy, gmap, ghyb, gsat]);
		mapg.setBaseLayer(gmap);

		return mapg;
	},

	createOsmMap: function () {
		var mapOsm = new OpenLayers.Map('osmmap', {
			controls: [
				new OpenLayers.Control.Navigation(),
				new OpenLayers.Control.PanZoom(),
				new OpenLayers.Control.KeyboardDefaults()]
		});

		var layer = new OpenLayers.Layer.OSM("OSM");
		mapOsm.addLayer(layer);
		mapOsm.setBaseLayer(layer);

		return mapOsm;
	},

    synchronizeMaps: function (tabPanel, tab) {
        var dstMap = null;

        switch (tab) {
		case this.baseMapPanel:
			break;
		case this.googleMapPanel:
			dstMap = this.googleMapPanel.map;
			break;
		case this.osmMapPanel:
			dstMap = this.osmMapPanel.map;
			break;
        }

        if (dstMap !== null) {
            var srcMap = this.baseMapPanel.map;
            if (srcMap.getExtent() !== null) {
                // zoom to base map extents
                var dstExtent = srcMap.getExtent().transform(srcMap.getProjectionObject(), dstMap.getProjectionObject());
                dstMap.zoomToExtent(dstExtent);
            }
        }
    },

    getBaseOlMap: function () {
        return this.baseOlMap;
    }
});