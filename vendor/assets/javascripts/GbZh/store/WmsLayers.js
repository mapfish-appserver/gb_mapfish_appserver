Ext.define('GbZh.store.WmsLayers', {
	extend: 'Ext.data.Store',
	model: 'GbZh.model.WmsLayer',
	requires: ['GbZh.model.WmsLayer', 'GbZh.base.ViewerState'],
	singleton: true,
	autoLoad: false,

	config: {
		url: '../../layers.json',
		urlTopicParam: 'topic',
		loadOptions: {
			params: {},
			scope: this,
			add: true
		}
	},

	sorters: [{
		property: 'query_sort',
		direction: 'ASC'
	}],

	constructor: function (config) { /* ******************************** */
		Ext.util.Observable.capture(this, function (e, params) {
			var tmp = "";
			if (typeof (params) === 'object') {
				tmp = '  (' + params.$className + ')';
			}
			//LOG console.log('Store-event: ' + e + tmp);
		}); /* ******************************** */

		this.callParent(arguments);

		GbZh.base.ViewerState.on('topicselected', this.loadTopic, this);
		this.on('load', this.topicLoaded, this, this.config.loadOptions);

		//		this.on('datachanged', alert('dc'), this);
	},

	loadTopic: function (topic) {
		//LOG console.log('WmsLayers: loadTopic ' + topic.name);
		var index = this.findExact('topic', topic.name);
		if (index === -1) {
			// compose topic URL
			// e.g. 'http://localhost:3000/layers.json?foo=bar' + 'topic' + name => 'http://localhost:3000/layers.json?foo=bar&topic=name'
			var params = {};
			params[this.config.urlTopicParam] = topic.name;
			var url = Ext.urlAppend(this.config.url, Ext.urlEncode(params));

			this.setProxy({
				type: this.model.proxy.type,
				url: url,
				reader: this.model.proxy.reader
			});

			this.config.loadOptions.topic = topic;
			this.load(this.config.loadOptions);
		} else {
			// topic already in store
			this.topicReady(topic);
		}
	},

	topicLoaded: function (store, records, successful, options) {
		if (!successful || !records || records.length <= 0) {
			//LOG console.log("ERROR: Keine WMS-Layers gefunden fuer topic.");
		} else {
			this.topicReady(options.topic);
		}
	},

	topicReady: function (topic) {
		//LOG console.log("topicReady: " + topic.name);
		this.resetTopicVisibilities(topic.name);
		//LOG console.log("******************************************************************************************");
		//LOG console.log(GbZh.store.Topics);
		GbZh.base.ViewerState.fireEvent('wmslayerstoreloaded', topic);
	},

	/**
	 * Layer config for OpenLayers map
	 */
	getlayersparam: function (topicName) {
		return this.layersParam(topicName, true);
	},

	/**
	 * Disabled layers for permalink offlayers attribute
	 */
	getOffLayersParam: function (topicName) {
		return this.layersParam(topicName, false);
	},

	/**
	 * Get comma separated layers string
	 */
	layersParam: function (topicName, visible) {
		var wmslayers = '';
		this.filter([{
			property: 'wms',
			value: 'false'
		}, {
			property: 'visuser',
			value: visible ? 'true' : 'false'
		}, {
			property: 'topic',
			value: topicName,
			exactMatch: true
		}]);
		//TODO: wms_sort statt id (wmsorder fehlt im json)
		this.sort('wms_sort', 'ASC');
		this.each(function (r) {
			wmslayers += r.data.layername + ',';
		});
		if (wmslayers !== '') {
			wmslayers = wmslayers.slice(0, wmslayers.length - 1);
		}
		this.clearFilter(true);

//		//LOG console.log(this.buildLayerQuery());
		return wmslayers;
	},

	buildLayerQuery: function () {
		var v = this.layersQueryParam(
			GbZh.base.ViewerState.currentTopic.name,
			true,
			GbZh.base.ViewerState.map.getScale()
		);
		return v;
	},

	/**
	 * Get comma separated layers string
	 */
	layersQueryParam: function (topicName, visible, scale) {
		var wmslayers = '';
		this.filter([{
			property: 'wms',
			value: 'false'
		}, {
			property: 'visuser',
			value: visible ? 'true' : 'false'
		}, {
			property: 'topic',
			value: topicName,
			exactMatch: true
		}, {
			property: 'minscale',
			filterFn: function (item) { return item.get("minscale") < scale && item.get("maxscale") > scale; }
		}]);
		this.sort('query_sort', 'DESC');
		this.each(function (r) {
			wmslayers += r.data.layername + ',';
		});
		if (wmslayers !== '') {
			wmslayers = wmslayers.slice(0, wmslayers.length - 1);
		}
		this.clearFilter(true);
		this.sort('wms_sort', 'ASC');
		return wmslayers;
	},

	resetTopicVisibilities: function (topicName) {
		// reset visibility flags
		this.filter([{
			property: 'topic',
			value: topicName,
			exactMatch: true
		}]);
		this.each(function (r) {
			r.data.visuser = r.data.visini;
		});
		this.clearFilter(true);
	},

	/**
	 * Set visibility of a list of topic layers
	 */
	setTopicLayerVisibility: function (topicName, layerNames, visible) {
		Ext.each(layerNames, function (layerName) {
			// update record
			this.store.filter([{
				property: 'layername',
				value: layerName,
				exactMatch: true
			}, {
				property: 'topic',
				value: this.topicName,
				exactMatch: true
			}]);
			this.store.each(function (r) {
				r.data.visuser = visible;
			});
			this.store.clearFilter(true);
		}, {
			store: this,
			topicName: topicName
		});

		GbZh.base.ViewerState.fireEvent('wmslayerstorevisibilitychanged', topicName, this.getlayersparam(topicName));
	},

	/**
	 * Set visibility of all layers of a topic
	 */
	setTopicVisibility: function (topicName, visible) {
		// update records
		this.filter([{
			property: 'topic',
			value: topicName,
			exactMatch: true
		}]);
		this.each(function (r) {
			if (r.data.visuser !== visible) {
				r.data.visuser = visible;
			}
		});
		this.clearFilter(true);

		GbZh.base.ViewerState.fireEvent('wmslayerstorevisibilitychanged', topicName, this.getlayersparam(topicName));
	},

	/** private: method[destroy]
	 */
	destroy: function () {
		GbZh.base.ViewerState.superclass.destroy.call(this);
	}

});