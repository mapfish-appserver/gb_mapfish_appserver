Ext.define('GbZh.widgets.FeatureExportPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.gb-featureexportpanel',
    requires: ['GbZh.base.ViewerState'],

    // config
    title: "Export",
    bodyPadding: 5,
    config: {
        /*
         *  map: OpenLayers.Map
         */
        map: null,
        /*
         *  editLayers: Array of {
         *      name: export layer name,
         *      url: export CSV url
         *  }
         */
        exportLayers: []
    },

    // private
    exportLayerCombobox: null,
    bboxButton: null,
    polygonButton: null,
    selectionModes: [], // Array of {button: selection button, handler: selection mode handler}
    exportButton: null,
    exportLayerUrl: null, // current export layer url
    map: null, // OpenLayers.Map
    selectionLayer: null, // OpenLayers.Layer.Vector for selection
    selectionControls: [],
    bboxControl: null,
    bboxBounds: null, // current bbox selection
    polygonControl: null,
    polygonFeature: null, // current polygon selection feature

    initComponent: function () {
        this.callParent(arguments);

        // export layers selection
        var exportLayersData = [];
        for (var i=0; i < this.exportLayers.length; i++) {
            var exportLayer = this.exportLayers[i];
            exportLayersData.push({
                name: exportLayer.name,
                config: exportLayer
            });
        }
        var exportLayersStore = Ext.create('Ext.data.Store', {
            fields: ['name', 'config'],
            data : exportLayersData
        });

        this.exportLayerCombobox = Ext.create(Ext.form.ComboBox, {
            xtype: 'combobox',
            fieldLabel: "Exportlayer",
            store: exportLayersStore,
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            listeners: {
                select: this.selectExportLayer,
                scope: this
            }
        });

        // panel items
        this.selectionModes = [];

        this.bboxButton = Ext.create(Ext.Button, {
            text: "Select bbox",
            enableToggle: true,
            toggleGroup: 'selection',
            disabled: true,
            handler: this.setSelectionMode,
            scope: this
        });
        this.selectionModes.push({
            button: this.bboxButton,
            handler: this.setBBoxMode
        });

        this.polygonButton = Ext.create(Ext.Button, {
            text: "Select polygon",
            enableToggle: true,
            toggleGroup: 'selection',
            disabled: true,
            handler: this.setSelectionMode,
            scope: this
        });
        this.selectionModes.push({
            button: this.polygonButton,
            handler: this.setPolygonMode
        });

        this.exportButton = Ext.create(Ext.Button, {
            text: "CSV Export",
            disabled: true,
            handler: this.exportCSV,
            scope: this
        });

        this.add([
            this.exportLayerCombobox,
            this.bboxButton,
            this.polygonButton,
            {
                xtype: 'box',
                height: 10
            },
            this.exportButton
        ]);

        this.on("deactivate", this.onDeactivate);
        this.on('resize', this.resizeItems, this, this);
    },

    onDeactivate: function() {
        // deselect tools
        for (var i=0; i<this.selectionModes.length; i++) {
            this.selectionModes[i].button.toggle(false);
        }
        // disable controls
        this.setSelectionMode();
    },

    selectExportLayer: function(combo, records) {
        var config = records[0].data.config;
        this.exportLayerUrl = config.url;

        if (this.selectionLayer == null) {
            // create selection layer
            this.selectionLayer = new OpenLayers.Layer.Vector(
                "Selection",
                {}
            );
            this.map.addLayer(this.selectionLayer);
        }

        // enable tools
        for (var i=0; i<this.selectionModes.length; i++) {
            this.selectionModes[i].button.enable();
        }
    },

    setSelectionMode: function() {
        // cleanup
        if (this.selectionLayer != null) {
            this.selectionLayer.destroyFeatures();
        }
        this.exportButton.setDisabled(true);

        // setup selection mode
        for (var i=0; i<this.selectionModes.length; i++) {
            this.selectionModes[i].handler.call(this);
        }
    },

    setBBoxMode: function() {
        if (this.bboxButton.pressed) {
            if (this.bboxControl == null) {
                // create bbox selection control
                this.bboxControl = new OpenLayers.Control();
                OpenLayers.Util.extend(this.bboxControl, {
                    draw: function() {
                        this.handler = new OpenLayers.Handler.Box(
                            this,
                            {
                                done: this.bboxSelected
                            },
                            {
                                keyMask: OpenLayers.Handler.MOD_NONE
                            }
                        );
                    },
                    bboxSelected: function(bounds) {
                        // scope will be this.featureExportPanel
                        this.featureExportPanel.bboxSelected(bounds);
                    }
                });
                // workaround for scope: set FeatureExportPanel instance as Control member
                this.bboxControl.featureExportPanel = this;
                this.map.addControl(this.bboxControl);
                this.selectionControls.push(this.bboxControl);
            }

            this.bboxControl.activate();
        }
        else {
            // reset bbox selection
            if (this.bboxControl != null) {
                this.bboxControl.deactivate();
            }
            this.bboxBounds = null;
        }
    },

    bboxSelected: function(bounds) {
        // reset selection
        this.bboxBounds = null;
        this.selectionLayer.destroyFeatures();

        // add bbox feature
        var minXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.bottom));
        var maxXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.top));
        if (!isNaN(minXY.lon) && !isNaN(minXY.lat) && !isNaN(maxXY.lon) && !isNaN(maxXY.lat)) {
            this.bboxBounds = new OpenLayers.Bounds(minXY.lon, minXY.lat, maxXY.lon, maxXY.lat);
            var bboxFeature = new OpenLayers.Feature.Vector(
                this.bboxBounds.toGeometry()
            );
            this.selectionLayer.addFeatures([bboxFeature]);

            this.exportButton.setDisabled(false);
        }
        else {
            this.exportButton.setDisabled(true);
        }
    },

    setPolygonMode: function() {
        if (this.polygonButton.pressed) {
            if (this.polygonControl == null) {
                // create polygon selection control
                this.polygonControl = new OpenLayers.Control();
                OpenLayers.Util.extend(this.polygonControl, {
                    draw: function() {
                        this.handler = new OpenLayers.Handler.Polygon(
                            this,
                            {
                                done: this.polygonSelected
                            },
                            {
                                keyMask: OpenLayers.Handler.MOD_NONE
                            }
                        );
                    },
                    polygonSelected: function(polygon) {
                        // scope will be this.featureExportPanel
                        this.featureExportPanel.polygonSelected(polygon);
                    }
                });
                // workaround for scope: set FeatureExportPanel instance as Control member
                this.polygonControl.featureExportPanel = this;
                this.map.addControl(this.polygonControl);
                this.selectionControls.push(this.polygonControl);
            }

            this.polygonControl.activate();
        }
        else {
            // reset bbox selection
            if (this.polygonControl != null) {
                this.polygonControl.deactivate();
            }
            this.polygonFeature = null;
        }
    },

    polygonSelected: function(polygon) {
        // reset selection
        this.polygonFeature = null;
        this.selectionLayer.destroyFeatures();

        // add polygon feature
        this.polygonFeature = new OpenLayers.Feature.Vector(polygon);
        this.selectionLayer.addFeatures([this.polygonFeature]);

        this.exportButton.setDisabled(false);
    },

    exportCSV: function() {
        var filterParams = null;
        if (this.bboxBounds != null) {
            filterParams = {
                bbox: this.bboxBounds.toString()
            };
        }
        else if (this.polygonFeature != null) {
            var wktFormat = new OpenLayers.Format.WKT();
            filterParams = {
                polygon: wktFormat.write(this.polygonFeature)
            };
        }

        if (filterParams != null) {
            var url = Ext.urlAppend(
                this.exportLayerUrl,
                Ext.Object.toQueryString(filterParams)
            );
            if (Ext.isOpera || Ext.isIE) {
                // Make sure that Opera and IE don't replace the content tab with the csv
                window.open(url);
            }
            else {
                // This avoids popup blockers for all other browsers
                window.location.href = url;
            }
        }
    },

    resizeItems: function(panel, width, height) {
        var innerWidth = width - 2 * this.bodyPadding;
        this.exportLayerCombobox.width = innerWidth;
        this.doLayout();
    },

    beforeDestroy: function () {
        // cleanup
        for (var i=0; i<this.selectionControls.length; i++) {
            this.selectionControls[i].deactivate();
            this.map.removeControl(this.selectionControls[i]);
        }
        if (this.selectionLayer != null) {
            this.map.removeLayer(this.selectionLayer);
            this.selectionLayer = null;
        }
        this.selectionModes = [];
    }
});

/*
    Sample usage:

    var map = new OpenLayers.Map();

    var item_config =
    {
        xtype: 'gb-featureexportpanel',
        map: map,
        exportLayers: [
            {
                name: "LiWa",
                url: "/geo/aln_fns_apliwa_pflege_fs.csv"
            }
        ]
    }
*/
