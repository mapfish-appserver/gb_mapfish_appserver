Ext.define('GbZh.widgets.RedliningPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.gb-redliningpanel',
    requires: ['GbZh.base.ViewerState'],

    // config
    title: "Redlining",
    bodyPadding: 5,
    config: {
        /*
         *  map: OpenLayers.Map
         */
        map: null
    },

    // private
    toolButtons: null,
    toolControls: null,
    redliningLayer: null,

    initComponent: function () {
        this.callParent(arguments);

        var redliningLayers = this.map.getLayersBy('redlining', true);
        if (redliningLayers.length > 0) {
            // use existing redlining layer
            this.redliningLayer = redliningLayers[0];
        }
        else {
            // add layer
            var redliningStyles = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    strokeWidth: 2,
                                    fillColor: "#ff0000",
                                    strokeColor: "#ff0000"
                                },
                                "Line": {
                                    strokeWidth: 2,
                                    strokeColor: "#ff0000"
                                },
                                "Polygon": {
                                    strokeWidth: 2,
                                    fillColor: "#ff0000",
                                    strokeColor: "#ff0000"
                                }
                            }
                        })
                    ]
                }),
                "select": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    strokeWidth: 2,
                                    fillColor: "#800000",
                                    strokeColor: "#800000"
                                },
                                "Line": {
                                    strokeWidth: 2,
                                    strokeColor: "#800000"
                                },
                                "Polygon": {
                                    strokeWidth: 2,
                                    fillColor: "#800000",
                                    strokeColor: "#800000"
                                }
                            }
                        })
                    ]
                }),
                "temporary": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    fillOpacity: 0.3,
                                    strokeOpacity: 0.7,
                                    fillColor: "#ff0000",
                                    strokeColor: "#ff0000"
                                },
                                "Line": {
                                    strokeOpacity: 0.7,
                                    strokeColor: "#ff0000"
                                },
                                "Polygon": {
                                    fillOpacity: 0.3,
                                    strokeOpacity: 0.7,
                                    fillColor: "#ff0000",
                                    strokeColor: "#ff0000"
                                }
                            }
                        })
                    ]
                })
            });
            this.redliningLayer = new OpenLayers.Layer.Vector(
                "Redlining",
                {
                    styleMap: redliningStyles,
                    eventListeners: {
                        featureadded: this.updatePermalink,
                        afterfeaturemodified: this.updatePermalink,
                        featureremoved: this.updatePermalink,
                        scope: this
                    },
                    // custom params
                    redlining: true
                }
            );
            this.map.addLayer(this.redliningLayer);
        }

        // controls
        this.toolButtons = [];
        this.toolControls = [];

        this.addRedliningTool({
            name: "Punkt",
            icon: "img/redlining_point.png",
            control: new OpenLayers.Control.DrawFeature(this.redliningLayer, OpenLayers.Handler.Point, {multi: false})
        });
        this.addRedliningTool({
            name: "Linie",
            icon: "img/redlining_line.png",
            control: new OpenLayers.Control.DrawFeature(this.redliningLayer, OpenLayers.Handler.Path, {multi: false})
        });
        this.addRedliningTool({
            name: "Polygon",
            icon: "img/redlining_polygon.png",
            control: new OpenLayers.Control.DrawFeature(this.redliningLayer, OpenLayers.Handler.Polygon, {multi: false})
        });
        this.addRedliningTool({
            name: "Editieren",
            icon: "img/redlining_edit.png",
            control: new OpenLayers.Control.ModifyFeature(this.redliningLayer)
        });
        this.addRedliningTool({
            name: "Löschen",
            icon: "img/redlining_delete.png",
            control: new OpenLayers.Control.SelectFeature(
                this.redliningLayer,
                {
                    eventListeners: {
                        featurehighlighted: function(e) {
                            // ask for confirmation
                            if(confirm("Redlining-Objekt löschen?")) {
                                this.redliningLayer.destroyFeatures([e.feature]);
                            }
                            else {
                                e.object.unselectAll();
                            }
                        },
                        scope: this
                    }
                })
        });
        this.add({
            xtype: 'button',
            tooltip: 'Alle löschen',
            icon: "img/redlining_delete_all.png",
            handler:  function () {
                if(confirm("Alle Redlining-Objekte löschen?")) {
                    this.redliningLayer.removeAllFeatures();
                }
            },
            scope: this
        });

        this.on("deactivate", this.onDeactivate);
        GbZh.base.ViewerState.on('redliningpermalinkfeaturesadd', this.addPermalinkFeatures, this, this);
    },

    beforeDestroy: function () {
        this.deactivateTools();
        for (var i=0; i<this.toolControls.length; i++) {
            this.map.removeControl(this.toolControls[i]);
        }

        // NOTE: keep redlining layer when closing panel
    },

    onDeactivate: function() {
        this.deactivateTools();
        // deselect tools
        for (var i=0; i<this.toolButtons.length; i++) {
            this.toolButtons[i].toggle(false);
        }
    },

    addRedliningTool: function(config) {
        var toolControl = config.control || new OpenLayers.Control();
        this.toolControls.push(toolControl);
        this.map.addControls([toolControl]);

        var button = Ext.create(Ext.Button, {
            icon: config.icon || "img/pen.png",
            tooltip: config.name || "Tool",
            enableToggle: true,
            toggleGroup: 'RedlineTools',
            handler: function() {
                this.activateTool(button, toolControl);
            },
            scope: this
        });
        this.add(button);
        this.toolButtons.push(button);
    },

    deactivateTools: function() {
        // disable tool controls
        for (var i=0; i<this.toolControls.length;i++) {
            this.toolControls[i].deactivate();
        }

        // enable identify tool
        GbZh.base.ViewerState.fireEvent('identifytoggled', true);
    },

    activateTool: function(toolButton, toolControl) {
        this.deactivateTools();

        if (toolButton.pressed) {
            // disable identify tool
            GbZh.base.ViewerState.fireEvent('identifytoggled', false);

            toolControl.activate();
        }
    },

    // convert permalink param to redlining features
    addPermalinkFeatures: function(features) {
        // convert WKT to features
        var format = new OpenLayers.Format.WKT();
        this.redliningLayer.addFeatures(format.read(features));
    },

    // set redlining features as permalink param
    updatePermalink: function() {
        // round feature coordinates to shorten permalink string
        var numFeatures = this.redliningLayer.features.length;
        for (var i=0; i<numFeatures; i++) {
            var vertices = this.redliningLayer.features[i].geometry.getVertices();
            var numVertices = vertices.length;
            for (var j=0; j<numVertices; j++) {
                var vertex = vertices[j];
                vertex.x = Ext.util.Format.round(vertex.x, 2);
                vertex.y = Ext.util.Format.round(vertex.y, 2);
            }
        }

        // convert features to WKT
        var format = new OpenLayers.Format.WKT();
        GbZh.base.ViewerState.fireEvent('redliningpermalinkupdate', format.write(this.redliningLayer.features));
    }
});
