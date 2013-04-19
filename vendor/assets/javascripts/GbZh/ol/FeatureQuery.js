OpenLayers.Control.FeatureQuery = OpenLayers.Class(OpenLayers.Control.GetFeature, {
	requires: ['GbZh.base.ViewerState'],

	outputNode: '#info .x-panel-body',

	request: function (bounds, options) {
		options = options || {};
		var latlon = bounds.getCenterLonLat();
		GbZh.base.ViewerState.fireEvent('identifyclicked', latlon.lon, latlon.lat);
		if (this.displayProjection) {
			bounds.transform(this.map.getProjectionObject(), this.displayProjection);
		}

		var filter = new OpenLayers.Filter.Spatial({
			type: OpenLayers.Filter.Spatial.BBOX,
			value: bounds
		});
		var topicName = (GbZh.base.ViewerState === null) ? '' : GbZh.base.ViewerState.currentTopic.name;
		var layerNames = this.findLayers();

		var response = this.protocol.read({
			url: this.url,
			maxFeatures: options.single === true ? this.maxFeatures : undefined,
			filter: filter,
			params: {
				topic: topicName,
				layers: layerNames
			},
			callback: this.showResults,
			scope: this
		});
	},

	showResults: function (result) {
		GbZh.base.ViewerState.fireEvent('featurequeryresultsready', result);
		// Reset the cursor.
		OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
	},

/*	showInfo: function (features) {
		var i, feature;
		var el = Ext.DomQuery.selectNode(this.outputNode);
		el.innerHTML = '';
		var dh = Ext.core.DomHelper; //alias
		for (i = 0; i < features.length; ++i) {
			feature = features[i];
			dh.append(el, feature.data);
		}

		// show marker on map
//		GbZh.base.ViewerState.fireEvent('identifyclicked', '../../images/identify_marker.png', clickPosition.lon, clickPosition.lat);
//		Ext.DomQuery.selectNode('#infoxy').innerHTML = Math.round(clickPosition.lon) + " / " + Math.round(clickPosition.lat);
	},

	clearInfo: function () {
		var el = Ext.DomQuery.selectNode(this.outputNode);
		el.innerHTML = '';
	},
*/
	/**
	 * Method: findLayers
	 * Internal method to get the layer names, independent of whether we are
	 *     inspecting the map or using a client-provided array
	 */

	findLayers: function () {
		var layerNames = [];
		var candidates = this.layers || this.map.layers;
		var layer;
		var i, len;

		for (i = 0, len = candidates.length; i < len; ++i) {
			layer = candidates[i];
			if (layer instanceof OpenLayers.Layer.WMS && (layer.getVisibility() && layer.inRange)) {
// vorher
//				layerNames = layerNames.concat(layer.params.LAYERS);
//TEST neu (dieser String sollte in der richtigen Infoabfragenreihenfolge und massstabbereinigt sein)
				layerNames = GbZh.store.WmsLayers.buildLayerQuery();
			}
		}
		return layerNames;
	},

	CLASS_NAME: "OpenLayers.Control.FeatureQuery"
});

OpenLayers.Format.Raw = OpenLayers.Class(OpenLayers.Format, {

	initialize: function (options) {
		OpenLayers.Format.prototype.initialize.apply(this, [options]);
	},

	read: function (text) {
		if (text.length > 0) {
			return [new OpenLayers.Feature(null, null, text)];
		} else {
			return [];
		}
	},

	CLASS_NAME: "OpenLayers.Format.Raw"
});