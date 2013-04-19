Ext.define('GbZh.widgets.MapComponent', {
	extend: 'Ext.Component',
	alias: 'widget.gb-mapcomponent',
	id: 'mapcomponent',
	requires: ['GbZh.base.ViewerState', 'GbZh.geoext.PrintExtent', 'GbZh.geoext.PrintProvider'],
	plugins: [],
/* Ext.create('GbZh.geoext.PrintExtent', {
		printProvider:  Ext.create('GbZh.geoext.PrintProvider', {
            method: "POST",
            url: '/print',
            autoLoad: true,
			pluginId: 'printextentplugin'
        })
    }), */

	config: {
		map: null,
		layers: null,
		controls: null,
		center: [8, 46],
		zoom: 5,
		extent: [7, 46, 9, 47]
		//TODO: do we really wish to have this fullscreen?
		//TODO: is this in any case a usefull default?
		//	fullscreen: true
	},

	initComponent: function () {
		// check config-property map for an existing OpenLayers.Map-instance, a
		// conf object for an OpenLayers.Map or null
		this.buildMap();

		// check config-property layers for any layers to be added to the map
		if (this.config.layers) {
			// normalize the case where this.layers was not an array but a layer 
			if (this.config.layers instanceof OpenLayers.Layer) {
				this.config.layers = [this.config.layers];
			}
			this.map.addLayers(this.config.layers);
		}

		// create a layerstore with the current maps layers
/*	this.layers =	Ext.create('GbZh.store.Layers', {
			data: this.map.layers
		});
 */
		// check config-property controls
		if (this.config.controls) {
			// normalize the case where this.controls was not an array but a control 
			if (this.config.controls instanceof OpenLayers.Control) {
				this.config.controls = [this.config.controls];
			}
			this.map.addControls(this.config.controls);
		}

		// check config-property center
		if (Ext.isString(this.config.center)) {
			//TODO: fromString method does not exist.!!!
			//	this.center = OpenLayers.LonLat.fromString(this.config.center);
		} else if (Ext.isArray(this.config.center)) {
			//TODO: this method does not exist. but IMO should
			//	this.center = OpenLayers.LonLat.fromArray(this.center);
			this.center = new OpenLayers.LonLat(this.config.center[0], this.config.center[1]);
		}

		// check config-property bounds
		if (Ext.isString(this.config.extent)) {
			this.extent = OpenLayers.Bounds.fromString(this.config.extent);
			this.extent = OpenLayers.Bounds.fromArray(this.config.extent);
		} else if (Ext.isArray(this.config.extent)) {

		}

		this.callParent(arguments);

		// events
		this.addEvents(
		// /** private: event[aftermapmove]
		// *	Fires after the map is moved.
		// */
			"aftermapmove",
		// /** private: event[aftermapmove]
		// *	Fires after the map is zoomed.
		// */
			"aftermapzoom"
		// /** private: event[afterlayervisibilitychange]
		// *	Fires after a layer changed visibility.
		// */
		// "afterlayervisibilitychange",
		// /** private: event[afterlayeropacitychange]
		// *	Fires after a layer changed opacity.
		// */
		// "afterlayeropacitychange",
		// /** private: event[afterlayerorderchange]
		// *	Fires after a layer order changed.
		// */
		// "afterlayerorderchange",
		// /** private: event[afterlayernamechange]
		// *	Fires after a layer name changed.
		// */
		// "afterlayernamechange",
		// /** private: event[afterlayeradd]
		// *	Fires after a layer added to the map.
		// */
		// "afterlayeradd",
		// /** private: event[afterlayerremove]
		// *	Fires after a layer removed from the map.
		// */
		// "afterlayerremove"
		);
		this.on({
			'resize': this.updateMapSize,
			scope: this
		});
		this.map.events.on({
			"moveend": this.onMoveend,
			"zoomend": this.onZoomend,
			// "changelayer": this.onChangelayer,
			// "addlayer": this.onAddlayer,
			// "removelayer": this.onRemovelayer,
			scope: this
		});
		GbZh.base.ViewerState.on('resetOlMap', this.onResetOlMap, this);
		GbZh.base.ViewerState.on('topicselected', this.invalidMap, this);
		// ***********************************************************************
		Ext.util.Observable.capture(this, function (e, params) {
			//LOG console.log('MapComponent-event: ' + e + ' (' + params + ')');
			//LOG console.log(this);
		});
		// ***********************************************************************
	},

	invalidMap: function () {
//		//LOG console.log("xxxxxxxxx invalidMap");
//		this.setLoading(true);
	},

	buildDefaultControls: function () {
		return [
		//			new OpenLayers.Control.TouchNavigation(),
			new OpenLayers.Control.Attribution()
		];
	},

	onResetOlMap: function () {
		//LOG console.log('onResetOlMap!');
		this.map = null;
		this.buildMap();
		//LOG console.log(this.map);
	},

	buildMap: function () {
		//LOG console.log("*** buildMap " + arguments);
		if (!(this.map instanceof OpenLayers.Map)) {
			//LOG console.log('onResetOlMap, buildMap!');
			this.controls = this.config.controls;
			var mapConf = Ext.applyIf(this.map || {}, {
				allOverlays: true,
				layers: [new OpenLayers.Layer('void', {
					isBaseLayer: true
				})],
				controls: this.buildDefaultControls()
			});
			this.map = new OpenLayers.Map(mapConf);
		} else {
			if (this.map.layers.length === 0) {
				this.map.addLayers([new OpenLayers.Layer('void', {
					isBaseLayer: true
				})]);
			}
		}
		// this.map is now initialized in any case
		GbZh.base.ViewerState.setCurrentMap(this.map);
	},

	/** private: method[onMoveend]
	*
	*	The "moveend" listener.
	*/
	onMoveend: function () {
		this.fireEvent("aftermapmove");
		GbZh.base.ViewerState.fireEvent("aftermapmove");
	},

	onZoomend: function () {
		this.fireEvent("aftermapzoom");
		GbZh.base.ViewerState.fireEvent("aftermapzoom");
		GbZh.base.ViewerState.fireEvent("mapscalechanged");
	},

	/** private: method[onChangelayer]
	*	:param e: ``Object``
	*
	* The "changelayer" listener.
	*/
/*	onChangelayer: function (e) {
		if (e.property) {
			if (e.property === "visibility") {
				this.fireEvent("afterlayervisibilitychange");
			} else if (e.property === "order") {
				this.fireEvent("afterlayerorderchange");
			} else if (e.property === "name") {
				this.fireEvent("afterlayernamechange");
			} else if (e.property === "opacity") {
				this.fireEvent("afterlayeropacitychange");
			}
		}
	},
 */	// /** private: method[onAddlayer]
	// */
	// onAddlayer: function () {
/*	CM
		update the layerstore by creating a new one 
		with the current maps layers
		TODO: sync?
 */
	// /*		this.layers = Ext.create('GbZh.store.Layers', {
	// data: this.map.layers
	// });
	// */		this.fireEvent("afterlayeradd");
	// },
	// /** private: method[onRemovelayer]
	// */
	// onRemovelayer: function () {
/*	CM
	update the layerstore by creating a new one 
	with the current maps layers
	TODO: sync?
 */
	// /*		this.layers = Ext.create('GbZh.store.Layers', {
	// data: this.map.layers
	// });
	// */
	// this.fireEvent("afterlayerremove");
	// },

	afterRender: function () {
		//LOG console.log("*** afterRender " + arguments);
		this.callParent(arguments);
		var me = this;
		if (!me.ownerCt) {
			me.renderMap();
		} else {
			//TODO: check if we need this
			me.ownerCt.on("move", me.updateMapSize, me);
			me.ownerCt.on({
				"afterlayout": {
					fn: me.renderMap,
					scope: me,
					single: true
				}
			});
		}
	},

	renderMap: function () {
		//LOG console.log("*** rendermap " + arguments);
		var me = this;
		var map = me.map;

		if (me.el && me.el.dom && me.el.dom.firstChild) {
			Ext.fly(me.el.dom.firstChild).remove();
		}
		map.render(me.el.dom);

		if (!map.getCenter()) {
			if (this.center || this.zoom) {
				// center and/or zoom?
				map.setCenter(this.center, this.zoom);
			} else if (this.extent instanceof OpenLayers.Bounds) {
				// extent
				map.zoomToExtent(this.extent, true);
			} else {
				map.zoomToMaxExtent();
			}
		}
	},

	//TODO: check if we need this
	updateMapSize: function () {
		//LOG console.log("*** updateMapSize ");
		//LOG console.log(arguments);
		if (this.map) {
			this.map.updateSize();
		}
	},

	/** private: method[beforeDestroy]
	 *	Private method called during the destroy sequence.
	 */
	beforeDestroy: function () {
		//LOG console.log("*** beforeDestroy " + arguments);
		if (this.ownerCt) {
			this.ownerCt.un("move", this.updateMapSize, this);
		}
		if (this.map && this.map.events) {
			this.map.events.un({
				"moveend": this.onMoveend,
				"changelayer": this.onChangelayer,
				"addlayer": this.onAddlayer,
				"removelayer": this.onRemovelayer,
				scope: this
			});
		}
		// if the map panel was passed a map instance, this map instance
		// is under the user's responsibility
		if (!this.initialConfig.map || !(this.initialConfig.map instanceof OpenLayers.Map)) {
			if (this.map && this.map.destroy) {
				this.map.destroy();
			}
		}
		delete this.map;
		GbZh.widgets.MapComponent.superclass.beforeDestroy.apply(this, arguments);
	}



/** api: function[guess]
 *	:return: ``GbZh.widgets.MapPanel`` The first map panel found by the Ext
 *			component manager.
 *	
 *	Convenience function for guessing the map panel of an application. This
 *		 can reliably be used for all applications that just have one map panel
 *		 in the viewport.
 
 */
/* GbZh.widgets.MapPanel.guess = function () {
		var guess;
		Ext.ComponentMgr.all.each(function(cmpId, cmp) { 
				if (cmp instanceof GbZh.widgets.MapPanel) {
						guess = cmp;
						return false; // return early
				} 
		});
		return guess;
};
 */

	//	DEAKTIVERT: 
/* Ext.define('GbZh.widgets.MapPanel', { 
	extend: 'Ext.Panel',
	
	alias: 'widget.gb-mappanel',
	title: "Karte",
	config: {
		map: {},
		zoom: 3,
		center:	null, 
		extent: null,
	},
	
	initComponent : function (){
			 Ext.applyIf (this, this.config);
		 this.callParent();				
		},

	afterRender : function (){
		this.callParent();
			if ((this.map instanceof OpenLayers.Map)) {
			this.map.zoomTo(this.getZoom());
			this.map.render(this.body.dom);
		}
	},
	
	applyMap: function(newMap) { 
		this.map = newMap;
		this.map.zoomTo(this.getZoom());
		this.map.render(this.body.dom);	
	}

});
 */

});