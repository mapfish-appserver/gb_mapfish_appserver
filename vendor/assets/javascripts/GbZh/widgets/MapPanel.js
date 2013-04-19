Ext.define('GbZh.widgets.MapPanel', { 
	extend: 'Ext.Component',
	alias: 'widget.gb-mappanel',
	requires: ['GbZh.store.Layers', 'GbZh.store.LayerReader'],
	config: {
		map: null,
		center: null,
		bounds: null
		//TODO: do we really wish to have this fullscreen?
		//TODO: is this in any case a usefull default?
//		fullscreen: true
	},
	
    initComponent: function () {        
        // check config-property map for an existing OpenLayers.Map-instance, a
        // conf object for an OpenLayers.Map or null
        if (!(this.map instanceof OpenLayers.Map)) {
            this.controls = this.defaultControls;
            var mapConf = Ext.applyif(this.map || {}, {
                allOverlays: true,
                controls: this.getDefaultControls()
            });
            this.map = new OpenLayers.Map(mapConf);
        }
        // this.map is now initialized in any case

        // check config-property layers for any layers to be added to the map
        if (this.layers) {
            // normalize the case where this.layers was not an array but a layer 
            if (this.layers instanceof OpenLayers.Layer) {
                this.layers = [this.layers];
            }
            this.map.addLayers(this.layers);          
        }
        
        // create a layerstore with the current maps layers
        this.layers =  Ext.create('GbZh.store.Layers', {
            data: this.map.layers
        });
        
        // check config-property controls
        if (this.controls) {
            // normalize the case where this.controls was not an array but a control 
            if (this.controls instanceof OpenLayers.Control) {
                this.controls = [this.controls];
            }
            this.map.addControls(this.controls);
        }
        
        // check config-property center
        if (Ext.isString(this.center)) {
            this.center = OpenLayers.LonLat.fromString(this.center);
        } else if (Ext.isArray(this.center)) {
            //TODO: this method does not exist. but IMO should
            // this.center = OpenLayers.LonLat.fromArray(this.center);
            this.center = new OpenLayers.LonLat(this.center[0], this.center[1]);
        } 

        // check config-property bounds
        if (Ext.isString(this.extent)) {
            this.extent = OpenLayers.Bounds.fromString(this.extent);
        } else if (Ext.isArray(this.extent)) {
            this.extent = OpenLayers.Bounds.fromArray(this.extent);
        }
		
        this.callParent();
 //        GbZh.widgets.MapPanel.superclass.initComponent.call(this);
        // events
        this.addEvents(
            /** private: event[aftermapmove]
             *  Fires after the map is moved.
             */
            "aftermapmove",

            /** private: event[afterlayervisibilitychange]
             *  Fires after a layer changed visibility.
             */
            "afterlayervisibilitychange",

            /** private: event[afterlayeropacitychange]
             *  Fires after a layer changed opacity.
             */
            "afterlayeropacitychange",

            /** private: event[afterlayerorderchange]
             *  Fires after a layer order changed.
             */
            "afterlayerorderchange",

            /** private: event[afterlayernamechange]
             *  Fires after a layer name changed.
             */
            "afterlayernamechange",

            /** private: event[afterlayeradd]
             *  Fires after a layer added to the map.
             */
            "afterlayeradd",

            /** private: event[afterlayerremove]
             *  Fires after a layer removed from the map.
             */
            "afterlayerremove"
        );
        this.map.events.on({
            "moveend": this.onMoveend,
            "changelayer": this.onChangelayer,
            "addlayer": this.onAddlayer,
            "removelayer": this.onRemovelayer,
            scope: this
        });
        
        
    },
 
	getDefaultControls: function () {
        return [
            new OpenLayers.Control.TouchNavigation(),
            new OpenLayers.Control.Attribution()
        ];   
    },
	
    /** private: method[onMoveend]
     *
     *  The "moveend" listener.
     */
    onMoveend: function () {
        this.fireEvent("aftermapmove");
    },

    /** private: method[onChangelayer]
     *  :param e: ``Object``
     *
     * The "changelayer" listener.
     */
    onChangelayer: function (e) {
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

    /** private: method[onAddlayer]
     */
    onAddlayer: function () {
		
		//CM
		// update the layerstore by creating a new one 
		// with the current maps layers
		//TODO: sync?
        this.layers = Ext.create('GbZh.store.Layers', {
            data: this.map.layers
        });
		
        this.fireEvent("afterlayeradd");
    },

    /** private: method[onRemovelayer]
     */
    onRemovelayer: function () {
		
		//CM
		// update the layerstore by creating a new one 
		// with the current maps layers
		//TODO: sync?
        this.layers = Ext.create('GbZh.store.Layers', {
            data: this.map.layers
        });
		
        this.fireEvent("afterlayerremove");
    },
      
    afterRender: function () {
        GbZh.widgets.MapPanel.superclass.afterRender.apply(this, arguments);
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
        if (this.map) {
            this.map.updateSize();
        }
    },
    
    /** private: method[beforeDestroy]
     *  Private method called during the destroy sequence.
     */
    beforeDestroy: function () {
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
        if (!this.initialConfig.map ||
				!(this.initialConfig.map instanceof OpenLayers.Map)) {         
			if (this.map && this.map.destroy) {
				this.map.destroy();
			}
        }
        delete this.map;
        GbZh.widgets.MapPanel.superclass.beforeDestroy.apply(this, arguments);
    }
    


/** api: function[guess]
 *  :return: ``GbZh.widgets.MapPanel`` The first map panel found by the Ext
 *      component manager.
 *  
 *  Convenience function for guessing the map panel of an application. This
 *     can reliably be used for all applications that just have one map panel
 *     in the viewport.
 
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

 //  DEAKTIVERT: 
 /* Ext.define('GbZh.widgets.MapPanel', { 
	extend: 'Ext.Panel',
	alias: 'widget.gb-mappanel',
	title: "Karte",
	config: {
		map: {},
		zoom: 3,
		center:  null, 
		extent: null,
	},
	
	initComponent : function (){
       Ext.applyif (this, this.config);
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