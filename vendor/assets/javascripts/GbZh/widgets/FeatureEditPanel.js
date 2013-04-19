Ext.define('GbZh.widgets.FeatureEditPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.gb-featureeditpanel',
    requires: ['GbZh.base.ViewerState'],

    // config
    title: "Edit",
    bodyPadding: 5,
    config: {
        /*
         *  map: OpenLayers.Map
         */
        map: null,
        /*
         *  editLayers: Array of {
         *      name: edit layer name,
         *      url: edit GeoJSON url,
         *      geomType: geometry type ("Point", "Linestring", "Polygon"),
         *      formItems: Ext.form.Panel items for editable feature attributes,
         *      snappingLayers: Array of {
         *          name: snapping layer name,
         *          url: snapping GeoJSON url,
         *          maxScale: max scale before snapping is disabled
         *      },
         *      copyLayers: Array of {
         *          name: copy layer name,
         *          url: copy GeoJSON url
         *      }
         *  }
         */
        editLayers: []
    },
    uploadGpxUrl: "/upload/gpx",

    // private
    editLayerCombobox: null,
    snappingLayerCombobox: null,
    snappingLayerPanel: null,
    snappingTooltip: null,
    gpxButton: null,
    gpxPanel: null,
    snappingToleranceField: null,
    resizableItems: [],
    toolButtons: [],
    toolInputs: [],
    lastTool: null, // most recently used tool button
    editButton: null,
    addButton: null,
    xyToolButton: null,
    xCoordInput: null,
    yCoordInput: null,
    xyAddButton: null,
    arcIntersectionButton: null,
    arcIntersectionInputs: [],
    orthogonalLinesButton: null,
    orthogonalLinesAbscissaInput: null,
    orthogonalLinesOrdinateInput: null,
    copyButton: null,
    copyLayerCombobox: null,
    attrPanel: null,
    editFormPanel: null,
    editFormSaveButton: null,
    formItems: null, // current Ext.form.Panel items
    map: null, // OpenLayers.Map
    editLayer: null, // current OpenLayers.Layer.Vector
    feature: null, // current OpenLayers.Feature.Vector
    originalFeatureInfo: null, // info of unedited feature
    editFeatureControls: [],
    getFeatureControl: null,
    selectFeatureControl: null,
    drawFeatureControl: null,
    modifyFeatureControl: null,
    arcIntersectionControl: null,
    orthogonalLinesControl: null,
    getCopyFeatureControl: null,
    saveStrategy: null,
    snappingLayer: null, // OpenLayers.Layer.Vector for snapping
    snappingControl: null,
    snappingMaxScale: null,
    gpxFeatures: [], // features from last GPX import
    gpxModel: null, // combobox entry for GPX snapping layer
    editStyleMap: null,
    copyStyleMap: null,

    // TODO: i18n

    initComponent: function () {
        this.callParent(arguments);

        // edit layers selection
        var editLayersData = [];
        for (var i=0; i < this.editLayers.length; i++) {
            var editLayer = this.editLayers[i];
            editLayersData.push({
                name: editLayer.name,
                config: editLayer
            });
        }
        var editLayersStore = Ext.create('Ext.data.Store', {
            fields: ['name', 'config'],
            data : editLayersData
        });

        this.editLayerCombobox = Ext.create(Ext.form.ComboBox, {
            xtype: 'combobox',
            fieldLabel: "Editlayer",
            store: editLayersStore,
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            listeners: {
                select: this.selectEditLayer,
                scope: this
            }
        });
        this.resizableItems.push(this.editLayerCombobox);

        // snapping layers selection
        this.snappingLayerCombobox = Ext.create(Ext.form.ComboBox, {
            xtype: 'combobox',
            fieldLabel: "Snapping layer",
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            allowBlank: true,
            listeners: {
                select: this.selectSnappingLayer,
                scope: this
            },
            disabled: true,
            flex: 1 // for hbox layout
        });

        // GPX upload
        this.gpxButton = Ext.create(Ext.Button, {
            text: "GPX",
            enableToggle: true,
            disabled: true,
            margin: '0 0 0 2',
            handler: function() {
                this.gpxPanel.setVisible(this.gpxButton.pressed);
            },
            scope: this
        });

        // horizontal layout for snapping layer combobox and GPX button
        this.snappingLayerPanel = Ext.create('Ext.Panel', {
            layout: 'hbox',
            border: false,
            items: [
                this.snappingLayerCombobox,
                this.gpxButton
            ]
        });
        this.resizableItems.push(this.snappingLayerPanel);

        // GPX upload panel
        this.gpxPanel = Ext.create(Ext.form.Panel, {
            title: "GPX upload",
            bodyPadding: 5,
            items: [
                {
                    xtype: 'form',
                    border: false,
                    items: [
                        {
                            xtype: 'filefield',
                            name: 'gpx_file',
                            fieldLabel: "GPX file",
                            buttonText: "...",
                            allowBlank: false
                        }
                    ],
                    buttons: [
                        {
                            text: "Upload",
                            handler: this.uploadGpx,
                            scope: this
                        }
                    ]
                }
            ],
            hidden: true,
            listeners: {
                resize: this.resizeFormItems,
                scope: this
            }
        });

        // snapping tolerance
        this.snappingToleranceField = Ext.create(Ext.form.Number, {
            fieldLabel: "Tolerance (Pixel)",
            value: 10,
            minValue: 0,
            maxValue: 100,
            listeners: {
                change: function(field, newValue, oldValue, opts) {
                    if (newValue > this.snappingToleranceField.maxValue) {
                        // clamp value
                        this.snappingToleranceField.setValue(this.snappingToleranceField.maxValue);
                    }
                    else if (newValue != null) {
                        // set new snapping tolerance
                        for (var i=0; i < this.snappingControl.targets.length; i++) {
                            this.snappingControl.targets[i].nodeTolerance = newValue;
                            this.snappingControl.targets[i].vertexTolerance = newValue;
                            this.snappingControl.targets[i].edgeTolerance = newValue;
                        }
                    }
                },
                scope: this
            },
            disabled: true
        });
        this.resizableItems.push(this.snappingToleranceField);

        // tool widgets

        // select and edit feature
        this.editButton = Ext.create(Ext.Button, {
            text: "Edit",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            handler: function() {
                this.activateTool(this.editButton, [], [this.getFeatureControl, this.selectFeatureControl]);
            },
            scope: this
        });
        this.toolButtons.push(this.editButton);

        // draw feature
        this.addButton = Ext.create(Ext.Button, {
            text: "Add",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            handler: function() {
                this.activateTool(this.addButton, [], [this.drawFeatureControl]);
            },
            scope: this
        });
        this.toolButtons.push(this.addButton);

        // add point at x/y
        this.xyToolButton = Ext.create(Ext.Button, {
            text: "X/Y",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            hidden: true,
            handler: function() {
                this.activateTool(this.xyToolButton, [this.xCoordInput, this.yCoordInput, this.xyAddButton], []);
            },
            scope: this
        });
        this.toolButtons.push(this.xyToolButton);

        var maxExtent = [669000, 223000, 717000, 284000];
        this.xCoordInput = Ext.create(Ext.form.Number, {
            fieldLabel: "x (CH1903)",
            value: null,
            minValue: maxExtent[0],
            maxValue: maxExtent[2],
            listeners: {
                change: function(field, newValue, oldValue, opts) {
                    if (newValue > field.maxValue) {
                        // clamp value
                        field.setValue(field.maxValue);
                    }
                    else {
                        // activate add button
                        this.xyAddButton.setDisabled(newValue == null || !this.xCoordInput.isValid() || this.yCoordInput.value == null || !this.yCoordInput.isValid());
                    }
                },
                scope: this
            },
            hidden: true
        });
        this.resizableItems.push(this.xCoordInput);

        this.yCoordInput = Ext.create(Ext.form.Number, {
            fieldLabel: "y (CH1903)",
            value: null,
            minValue: maxExtent[1],
            maxValue: maxExtent[3],
            listeners: {
                change: function(field, newValue, oldValue, opts) {
                    if (newValue > field.maxValue) {
                        // clamp value
                        field.setValue(field.maxValue);
                    }
                    else {
                        // activate add button
                        this.xyAddButton.setDisabled(newValue == null || !this.yCoordInput.isValid() || this.xCoordInput.value == null || !this.xCoordInput.isValid());
                    }
                },
                scope: this
            },
            hidden: true
        });
        this.resizableItems.push(this.yCoordInput);

        this.xyAddButton = Ext.create(Ext.Button, {
            text: "Add point",
            disabled: true,
            handler: function() {
                this.addPoint(this.xCoordInput.value, this.yCoordInput.value);
            },
            scope: this,
            hidden: true
        });

        this.toolInputs.push([this.xCoordInput, this.yCoordInput, this.xyAddButton]);

        // Arc Intersection
        this.arcIntersectionButton = Ext.create(Ext.Button, {
            text: "Arc",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            hidden: true,
            handler: function() {
                this.activateTool(this.arcIntersectionButton, this.arcIntersectionInputs, [this.arcIntersectionControl]);
            },
            scope: this
        });
        this.toolButtons.push(this.arcIntersectionButton);

        this.arcIntersectionInputs = [];
        for (var i=0; i<2; i++) {
            var radiusInput = Ext.create(Ext.form.Number, {
                fieldLabel: "Radius " + (i+1) + " (m)",
                value: 100,
                minValue: 0,
                maxValue: 100000,
                listeners: {
                    change: function(field, newValue, oldValue, opts) {
                        if (newValue > field.maxValue) {
                            // clamp value
                            field.setValue(field.maxValue);
                        }
                        else if (newValue != null) {
                            // set new radius
                            this.panel.arcIntersectionControl.setRadius(this.circleIndex, newValue);
                        }
                    },
                    scope: {
                        panel: this,
                        circleIndex: i
                    }
                },
                hidden: true
            });
            this.arcIntersectionInputs.push(radiusInput);
            this.resizableItems.push(radiusInput);
        }
        this.toolInputs.push(this.arcIntersectionInputs);

        // Orthogonal Lines
        this.orthogonalLinesButton = Ext.create(Ext.Button, {
            text: "Ortho",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            hidden: true,
            handler: function() {
                this.activateTool(this.orthogonalLinesButton, [this.orthogonalLinesAbscissaInput, this.orthogonalLinesOrdinateInput], [this.orthogonalLinesControl]);
            },
            scope: this
        });
        this.toolButtons.push(this.orthogonalLinesButton);

        this.orthogonalLinesAbscissaInput = Ext.create(Ext.form.Number, {
            fieldLabel: "Abscissa (m)",
            value: 0,
            minValue: -100000,
            maxValue: 100000,
            listeners: {
                change: function(field, newValue, oldValue, opts) {
                    if (newValue > field.maxValue) {
                        // clamp value
                        field.setValue(field.maxValue);
                    }
                    else if (newValue != null) {
                        // set new radius
                        this.orthogonalLinesControl.setAbscissa(newValue);
                    }
                },
                scope: this
            },
            hidden: true
        });
        this.resizableItems.push(this.orthogonalLinesAbscissaInput);

        this.orthogonalLinesOrdinateInput = Ext.create(Ext.form.Number, {
            fieldLabel: "Ordinate (m)",
            value: 100,
            minValue: -100000,
            maxValue: 100000,
            listeners: {
                change: function(field, newValue, oldValue, opts) {
                    if (newValue > field.maxValue) {
                        // clamp value
                        field.setValue(field.maxValue);
                    }
                    else if (newValue != null) {
                        // set new radius
                        this.orthogonalLinesControl.setOrdinate(newValue);
                    }
                },
                scope: this
            },
            hidden: true
        });
        this.resizableItems.push(this.orthogonalLinesOrdinateInput);
        this.toolInputs.push([this.orthogonalLinesAbscissaInput, this.orthogonalLinesOrdinateInput]);

        // copy feature from layer
        this.copyButton = Ext.create(Ext.Button, {
            text: "Copy",
            enableToggle: true,
            toggleGroup: 'Tools',
            disabled: true,
            handler: function() {
                this.activateTool(this.copyButton, [this.copyLayerCombobox], [this.getCopyFeatureControl]);
                if (this.copyButton.pressed) {
                    // set copy layer style
                    if (this.copyStyleMap != null) {
                        this.editLayer.styleMap = this.copyStyleMap;
                    }
                }
            },
            scope: this,
            listeners: {
                toggle: function(button, pressed, options) {
                    if (!pressed) {
                        // copy tool deactivated
                        // reset layer style
                        if (this.editStyleMap != null) {
                            this.editLayer.styleMap = this.editStyleMap;
                        }
                    }
                },
                scope: this
            }
        });
        this.toolButtons.push(this.copyButton);

        // copy layers selection
        this.copyLayerCombobox = Ext.create(Ext.form.ComboBox, {
            xtype: 'combobox',
            fieldLabel: "Copy layer",
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            allowBlank: true,
            listeners: {
                select: this.selectCopyLayer,
                scope: this
            },
            disabled: true,
            hidden: true
        });
        this.toolInputs.push([this.copyLayerCombobox]);
        this.resizableItems.push(this.copyLayerCombobox);

        // feature attributes
        this.attrPanel = Ext.create(Ext.Panel, {
            title: "Feature Attributes",
            bodyPadding: 5,
            hidden: true,
            listeners: {
                resize: this.resizeFormItems,
                scope: this
            }
        });

        this.add([
            // layer and snapping selection
            this.editLayerCombobox,
            this.snappingLayerPanel,
            this.gpxPanel,
            this.snappingToleranceField,
            // tool buttons
            this.editButton,
            this.addButton,
            this.xyToolButton,
            this.arcIntersectionButton,
            this.orthogonalLinesButton,
            this.copyButton,
            // tool inputs
            this.xCoordInput,
            this.yCoordInput,
            this.xyAddButton,
            this.arcIntersectionInputs,
            this.orthogonalLinesAbscissaInput,
            this.orthogonalLinesOrdinateInput,
            this.copyLayerCombobox,
            // attributes
            this.attrPanel
        ]);

        this.on("activate", this.onActivate);
        this.on("deactivate", this.onDeactivate);
        this.on('resize', this.resizeItems, this, this);

    },

    onActivate: function() {
        if (this.editLayer != null) {
            // disable identify tool
            GbZh.base.ViewerState.fireEvent('identifytoggled', false);
        }
    },

    onDeactivate: function() {
        this.deactivateTools();
        // deselect tools
        for (var i=0; i<this.toolButtons.length; i++) {
            this.toolButtons[i].toggle(false);
        }
        // enable identify tool
        GbZh.base.ViewerState.fireEvent('identifytoggled', true);
    },

    selectEditLayer: function(combo, records) {
        var config = records[0].data.config;

        // cleanup
        this.removeEditLayer();

        // add edit layer
        this.editLayer = this.createOpenLayersEditLayer(config.name, config.url);
        this.map.addLayer(this.editLayer);

        // load feature on click
        this.getFeatureControl = new OpenLayers.Control.GetFeature({
            clickTolerance: 5,
            protocol: new OpenLayers.Protocol.HTTP({
                url: config.url,
                headers: {
                    'CONTENT-TYPE': "application/json; charset=UTF-8"
                },
                format: new OpenLayers.Format.GeoJSON()
            }),
            eventListeners: {
                featureselected: function(e) {
                    // disable tools and select new feature
                    this.deactivateTools();
                    this.editLayer.addFeatures([e.feature]);
                    this.selectFeatureControl.select(e.feature);
                },
                scope: this
            }
        });

        // add new edit controls
        this.selectFeatureControl = new OpenLayers.Control.SelectFeature(this.editLayer, {clickout: false});
        // NOTE: no multigeometries supported for editing
        var geomHandlers = {
            Point: OpenLayers.Handler.Point,
            Linestring: OpenLayers.Handler.Path,
            Polygon: OpenLayers.Handler.Polygon
        };
        this.drawFeatureControl = new OpenLayers.Control.DrawFeature(this.editLayer, geomHandlers[config.geomType], {multi: false});
        this.modifyFeatureControl = new OpenLayers.Control.ModifyFeature(this.editLayer, {standalone: true});

        // Arc Intersection
        this.arcIntersectionControl = new OpenLayers.Control.ArcIntersection(this.editLayer);
        for (var i=0; i<2; i++) {
            // init radius from input
            this.arcIntersectionControl.setRadius(i, this.arcIntersectionInputs[i].value);
        }

        // Orthogonal Lines
        this.orthogonalLinesControl = new OpenLayers.Control.OrthogonalLines(this.editLayer);
        // init abscissa and ordinate from inputs
        this.orthogonalLinesControl.setAbscissa(this.orthogonalLinesAbscissaInput.value);
        this.orthogonalLinesControl.setOrdinate(this.orthogonalLinesOrdinateInput.value);

        // dummy control
        this.getCopyFeatureControl = new OpenLayers.Control();

        this.editFeatureControls = [
            this.getFeatureControl,
            this.selectFeatureControl,
            this.drawFeatureControl,
            this.modifyFeatureControl,
            this.arcIntersectionControl,
            this.orthogonalLinesControl,
            this.getCopyFeatureControl
        ];
        this.map.addControls(this.editFeatureControls);

        // update available tools
        this.xyToolButton.setVisible(config.geomType == 'Point');
        this.arcIntersectionButton.setVisible(config.geomType == 'Point');
        this.orthogonalLinesButton.setVisible(config.geomType == 'Linestring');

        // enable edit buttons
        this.toggleEditWidgets(true);

        // reset edit mode
        this.activateDefaultTool();

        // reset feature edit
        this.feature = null;
        this.originalFeatureInfo = null;
        this.formItems = config.formItems;

        // update snapping layer selection
        this.removeSnappingLayer();
        this.updateLayerSelection(this.snappingLayerCombobox, config.snappingLayers);
        if (this.gpxModel != null) {
            // restore GPX selection option
            this.addGpxToSnappingSelection(this.gpxModel.data.name);
            this.snappingLayerCombobox.enable();
        }

        this.gpxButton.enable();
        this.gpxButton.toggle(false);
        this.gpxButton.handler.call(this.gpxButton.scope);

        // update copy layer selection
        this.updateLayerSelection(this.copyLayerCombobox, config.copyLayers);

        // disable identify tool
        GbZh.base.ViewerState.fireEvent('identifytoggled', false);
    },

    selectSnappingLayer: function(combo, records) {
        var config = records[0].data.config;
        if (config != null) {
            this.addSnappingLayer(config);
        }
        else {
            this.removeSnappingLayer();
        }
    },

    selectCopyLayer: function(combo, records) {
        var config = records[0].data.config;
        if (config != null) {
            this.enableCopy(config.url);
        }
        else {
            // remove from edit controls list
            this.editFeatureControls.splice(this.editFeatureControls.indexOf(this.getCopyFeatureControl), 1);
            this.map.removeControl(this.getCopyFeatureControl);

            // add dummy control
            this.getCopyFeatureControl = new OpenLayers.Control();
            this.editFeatureControls.push(this.getCopyFeatureControl);
            this.map.addControl(this.getCopyFeatureControl);
        }
    },

    updateLayerSelection: function(combobox, layers) {
        var layersData = [];
        layersData.push({
            name: "none",
            config: null
        });

        for (var i=0; i < layers.length; i++) {
            var snappingLayer = layers[i];
            layersData.push({
                name: snappingLayer.name,
                config: snappingLayer
            });
        }

        var store = Ext.create('Ext.data.Store', {
            fields: ['name', 'config'],
            data: layersData
        });
        combobox.bindStore(store);
        combobox.select("none");
        combobox.setDisabled(layers.length == 0);
    },

    enableLayerSelection: function(combobox) {
        // disable if only entry is 'none'
        combobox.setDisabled(combobox.getStore().getCount() <= 1);
    },

    deactivateTools: function() {
        // hide tool inputs
        for (var i=0; i<this.toolInputs.length;i++) {
            for (var j=0; j<this.toolInputs[i].length;j++) {
                this.toolInputs[i][j].hide();
            }
        }
        // cleanup edit features
        if (this.selectFeatureControl != null) {
            this.selectFeatureControl.unselectAll();
        }
        if (this.editLayer != null) {
            this.editLayer.removeAllFeatures();
        }
        // disable tool controls
        for (var i=0; i<this.editFeatureControls.length;i++) {
            this.editFeatureControls[i].deactivate();
        }
    },

    activateTool: function(toolButton, toolInputs, toolControls) {
        this.deactivateTools();

        if (toolButton.pressed) {
            // show tool inputs
            for (var i=0; i<toolInputs.length;i++) {
                toolInputs[i].show();
            }
            // activate tool controls
            for (var i=0; i<toolControls.length;i++) {
                toolControls[i].activate();
            }

            // remember current tool
            this.lastTool = toolButton;
        }
    },

    activateDefaultTool: function() {
        var button = this.editButton;
        button.toggle(true);
        button.handler.call(button.scope);
    },

    createOpenLayersEditLayer: function(name, url) {
        this.saveStrategy = new OpenLayers.Strategy.Save();
        this.saveStrategy.events.on({
            'success': function() {
                // redraw layers
                for (var i=0, len=this.map.layers.length; i<len; i++) {
                    this.map.layers[i].redraw(true);
                }
/*
                Ext.Msg.show({
                    title: "Save Feature",
                    msg: "Save successful",
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.INFO
                });
*/
            },
            'fail': function() {
                // TODO: recreate the deleted feature

                Ext.Msg.show({
                    title: "Save Feature",
                    msg: "Save failed",
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.ERROR
                });
            },
            scope: this
        });

        var editLayer = new OpenLayers.Layer.Vector(
            name,
            {
                strategies: [
                    this.saveStrategy
                ],
                protocol: new OpenLayers.Protocol.HTTP({
                    url: url,
                    headers: {
                        'CONTENT-TYPE': "application/json; charset=UTF-8"
                    },
                    format: new OpenLayers.Format.GeoJSON()
                }),
                eventListeners: {
                    beforefeatureadded: function(e) {
                        var feature = e.feature;
                        if (feature.fid == null) {
                            // new feature drawn by the user, as opposed
                            // to received from the web service

                            // disable tools and select new feature
                            this.deactivateTools();
                            this.selectFeatureControl.select(e.feature);
                        }
                    },
                    beforefeatureselected: function(e) {
                        this.showFeatureAttributes(e.feature);
                    },
                    featureunselected: function(e) {
                        this.hideFeatureAttributes();
                    },
                    scope: this
                }
            }
        );
        return editLayer;
    },

    removeEditLayer: function() {
        // remove edit layer
        if (this.editLayer != null) {
            this.map.removeLayer(this.editLayer);
            this.editLayer = null;
        }

        // cleanup old edit controls
        for (var i=0; i<this.editFeatureControls.length;i++) {
            var editControl = this.editFeatureControls[i];
            editControl.deactivate();
            this.map.removeControl(editControl);
        }

        // enable identify tool
        GbZh.base.ViewerState.fireEvent('identifytoggled', true);
    },

    addSnappingLayer: function(config) {
        this.removeSnappingLayer();

        var styles = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style(null, {
                rules: [
                    new OpenLayers.Rule({
                        symbolizer: {
                            "Point": {
                                pointRadius: 2,
                                graphicName: "square",
                                fillColor: "white",
                                fillOpacity: 0.25,
                                strokeWidth: 1,
                                strokeOpacity: 1,
                                strokeColor: "#0000ff"
                            },
                            "Line": {
                                strokeWidth: 2,
                                strokeOpacity: 1,
                                strokeColor: "#0000ff"
                            },
                            "Polygon": {
                                strokeWidth: 1,
                                strokeOpacity: 1,
                                fillColor: "#9999ff",
                                strokeColor: "#0000ff"
                            }
                        }
                    })
                ]
            })
        });

        var snappingOptions = {
            styleMap: styles
        };
        if (config.gpx == null) {
            snappingOptions = OpenLayers.Util.extend(snappingOptions, {
                visibility: false, // do not load features on start
                strategies: [
                    new OpenLayers.Strategy.BBOX({
                        ratio: 1
                    })
                ],
                protocol: new OpenLayers.Protocol.HTTP({
                    url: config.url,
                    headers: {
                        'CONTENT-TYPE': "application/json; charset=UTF-8"
                    },
                    format: new OpenLayers.Format.GeoJSON()
                })
            });
        }

        this.snappingLayer = new OpenLayers.Layer.Vector(
            "Snapping",
            snappingOptions
        );
        this.map.addLayer(this.snappingLayer);

        this.snappingControl = new OpenLayers.Control.Snapping({
            layer: this.editLayer,
            targets: [this.snappingLayer],
            greedy: false
        });
        this.map.addControl(this.snappingControl);

        this.snappingToleranceField.setDisabled(false);

        if (config.gpx == null) {
            // toggle snapping depending on map scale
            this.snappingMaxScale = config.maxScale;
            this.snappingTooltip = Ext.create('Ext.tip.ToolTip', {
                target: this.snappingLayerCombobox.labelEl.id,
                html: "Selected snapping layer is active only for scales up to 1:" + this.snappingMaxScale
            });
            this.map.events.on({
                zoomend: this.toggleSnapping,
                scope: this
            });
            this.toggleSnapping();
        }
        else {
            // add GPX features
            this.snappingLayer.addFeatures(this.gpxFeatures);

            this.snappingControl.activate();

            this.snappingLayerCombobox.labelEl.setOpacity(1);
            this.snappingToleranceField.labelEl.setOpacity(1);
        }
    },

    removeSnappingLayer: function() {
        if (this.snappingLayer != null) {
            this.map.events.un({
                zoomend: this.toggleSnapping,
                scope: this
            });

            this.snappingControl.deactivate();
            this.map.removeControl(this.snappingControl);
            this.snappingControl = null;

            if (this.snappingTooltip != null) {
                this.snappingTooltip.destroy();
                this.snappingTooltip = null;
            }

            this.snappingLayerCombobox.labelEl.setOpacity(1);
            this.snappingToleranceField.labelEl.setOpacity(1);
            this.snappingToleranceField.setDisabled(true);
            
            this.map.removeLayer(this.snappingLayer);
            this.snappingLayer = null;

            this.snappingMaxScale = null;
        }
    },

    toggleSnapping: function() {
        if (this.map.getScale() < this.snappingMaxScale) {
            // enable snapping and loading of snapping features
            this.snappingLayer.setVisibility(true);
            this.snappingControl.activate();

            this.snappingLayerCombobox.labelEl.setOpacity(1);
            this.snappingToleranceField.labelEl.setOpacity(1);
        }
        else {
            // disable snapping and loading of snapping features
            this.snappingLayer.setVisibility(false);
            this.snappingControl.deactivate();

            // fade snapping labels to mark out of scale range
            this.snappingLayerCombobox.labelEl.setOpacity(0.3);
            this.snappingToleranceField.labelEl.setOpacity(0.3);
        }
    },

    uploadGpx: function() {
        var form = this.gpxPanel.down('form').getForm();
        if (form.isValid()) {
            form.submit({
                url: this.uploadGpxUrl,
                waitMsg: "Uploading GPX file...",
                success: function(form, action) {
                    // close upload panel
                    this.gpxButton.toggle(false);
                    this.gpxButton.handler.call(this.gpxButton.scope);

                    // parse GPX
                    var gpx = Ext.util.Format.htmlDecode(action.result.gpx);
                    var parser = new OpenLayers.Format.GPX({
                        internalProjection: this.map.getProjectionObject(),
                        externalProjection: new OpenLayers.Projection("EPSG:4326")
                    });
                    var gpxFeatures = parser.read(gpx);
                    if (gpxFeatures.length > 0) {
                        // add to snapping layer combobox and select
                        this.addGpxToSnappingSelection(action.result.filename);
                        this.snappingLayerCombobox.select(this.gpxModel);

                        // add GPX features
                        this.gpxFeatures = gpxFeatures;
                        this.addSnappingLayer(this.gpxModel.data.config);
                    }
                    else {
                        Ext.Msg.show({
                            title: "GPX import",
                            msg: "Could not find any features.<br/>Is this a valid GPX file?",
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.WARNING
                        });
                    }
                },
                failure: function(form, action) {
                    Ext.Msg.show({
                        title: "GPX import",
                        msg: "GPX import failed:<p/>" + action.result.msg,
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.ERROR
                    });
                },
                scope: this
            });
        }
    },

    addGpxToSnappingSelection: function(filename) {
        // add or replace GPX entry in snapping layer combobox
        if (this.gpxModel != null) {
            this.snappingLayerCombobox.getStore().remove(this.gpxModel);
        }
        var models = this.snappingLayerCombobox.getStore().add({
            name: filename,
            config: {
                gpx: true
            }
        });
        this.gpxModel = models[0];
    },

    addPoint: function(x, y) {
        var newFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(x, y), null, null);
        newFeature.state = OpenLayers.State.INSERT;
        this.editLayer.addFeatures([newFeature]);

        this.map.setCenter(new OpenLayers.LonLat(x, y));
    },

    enableCopy: function(url) {
        // replace control
        if (this.getCopyFeatureControl != null) {
            // remove from edit controls list
            this.editFeatureControls.splice(this.editFeatureControls.indexOf(this.getCopyFeatureControl), 1);
            this.map.removeControl(this.getCopyFeatureControl);
        }

        // load copy feature on click
        this.getCopyFeatureControl = new OpenLayers.Control.GetFeature({
            clickTolerance: 5,
            protocol: new OpenLayers.Protocol.HTTP({
                url: url,
                headers: {
                    'CONTENT-TYPE': "application/json; charset=UTF-8"
                },
                format: new OpenLayers.Format.GeoJSON()
            }),
            eventListeners: {
                featureselected: function(e) {
                    // add feature copy to edit layer
                    this.copyFeature(e.feature);
                },
                scope: this
            }
        });
        this.editFeatureControls.push(this.getCopyFeatureControl);
        this.map.addControl(this.getCopyFeatureControl);
        this.getCopyFeatureControl.activate();

        // set copy layer style
        if (this.copyStyleMap == null) {
            this.editStyleMap = this.editLayer.styleMap;
            this.copyStyleMap = new OpenLayers.StyleMap({
                "select": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    pointRadius: 2,
                                    graphicName: "square",
                                    fillColor: "white",
                                    fillOpacity: 0.25,
                                    strokeWidth: 1,
                                    strokeOpacity: 1,
                                    strokeColor: "#00ff00"
                                },
                                "Line": {
                                    strokeWidth: 2,
                                    strokeOpacity: 1,
                                    strokeColor: "#00ff00"
                                },
                                "Polygon": {
                                    strokeWidth: 2,
                                    strokeOpacity: 1,
                                    fillColor: "#99ff99",
                                    strokeColor: "#00ff00"
                                }
                            }
                       })
                    ]
                })
            });
        }
        this.editLayer.styleMap = this.copyStyleMap;
    },

    copyFeature: function (feature) {
        // copy feature geometry
        var newFeature = new OpenLayers.Feature.Vector(feature.geometry.clone(), null, null);
        newFeature.state = OpenLayers.State.INSERT;

        // copy editable attributes only
        for (var i=0; i<this.formItems.length; i++) {
            var a = this.formItems[i].name;
            if (feature.attributes.hasOwnProperty(a) && this.formItems[i].xtype != 'displayfield') {
                newFeature.attributes[a] = feature.attributes[a];
            }
        }

        this.editLayer.addFeatures([newFeature]);
    },

    showFeatureAttributes: function(feature) {
        this.feature = feature;

        // store the initial state of the feature
        this.originalFeatureInfo = {
            geometry: this.feature.geometry.clone(),
            attributes: Ext.apply({}, this.feature.attributes),
            state: this.feature.state
        };

        // disable edit widgets
        this.copyLayerCombobox.setDisabled(true);
        this.toggleEditWidgets(false);

        // disable selecting other features while editing selected feature
        this.editLayer.events.triggerEvent("featuremodified", {feature: this.feature});
        for (var i=0; i<this.editFeatureControls.length;i++) {
            this.editFeatureControls[i].deactivate();
        }

        // create form panel
        this.editFormSaveButton = Ext.create(Ext.Button, {
            text: "Save",
            handler: this.saveFeature,
            scope: this
        });
        this.editFormPanel = Ext.create(Ext.form.Panel, {
            items: this.formItems,
            buttons: [
                this.editFormSaveButton,
                {
                    text: "Delete",
                    handler: this.confirmDeleteFeature,
                    scope: this
                },
                {
                    text: "Cancel",
                    handler: this.cancelFeatureEdit,
                    scope: this
                }
            ],
            listeners: {
                fieldvaliditychange: this.checkFormIsValid,
                scope: this
            },
            border: false
        });

        // apply feature attributes used in form items
        var values = {};
        var attributes = feature.attributes;
        for (var i=0; i<this.formItems.length; i++) {
            var a = this.formItems[i].name;
            if (attributes.hasOwnProperty(a)) {
                values[a] = attributes[a];
            }
        }
        this.editFormPanel.getForm().setValues(values);

        // show feature edit form
        this.attrPanel.show();
        this.attrPanel.removeAll();
        this.attrPanel.add(this.editFormPanel);
        this.checkFormIsValid();

        // enable feature geometry editing
        this.modifyFeatureControl.activate();
        this.modifyFeatureControl.selectFeature(feature);
    },

    hideFeatureAttributes: function() {
        this.feature = null;
        this.originalFeatureInfo = null;

        this.attrPanel.hide();

        // reactivate last tool
        this.lastTool.toggle(true);
        this.lastTool.handler.call(this.lastTool.scope);

        // enable edit widgets
        this.enableLayerSelection(this.snappingLayerCombobox);
        this.enableLayerSelection(this.copyLayerCombobox);
        this.toggleEditWidgets(true);
    },

    saveFeature: function() {
        // apply form attributes to feature
        var values = this.editFormPanel.getValues();
        for (var key in values) {
            if (this.feature.fid == null || this.feature.attributes.hasOwnProperty(key)) {
                this.feature.attributes[key] = values[key];
            }
        }

        // save feature
        if (this.feature.fid == null) {
            // new feature
            this.feature.state = OpenLayers.State.INSERT;
        }
        else {
            // existing feature
            this.feature.state = OpenLayers.State.UPDATE;
        }
        this.saveStrategy.save([this.feature]);

        // close form
        this.hideFeatureAttributes();
    },

    confirmDeleteFeature: function() {
        Ext.Msg.show({
            title: "Delete Feature?",
            msg: "Are you sure you want to delete this feature?",
            buttons: Ext.Msg.YESNO,
            icon: Ext.MessageBox.QUESTION,
            fn: function(button) {
                if(button === "yes") {
                    this.deleteFeature();
                }
            },
            scope: this
        });      
    },

    deleteFeature: function() {
        this.feature.state = OpenLayers.State.DELETE;
        if (this.feature.fid == null) {
            // new feature unknown to the server
            this.editLayer.destroyFeatures([this.feature]);
        }
        else{
            // existing feature
            this.saveStrategy.save([this.feature]);
        }

        // close form
        this.hideFeatureAttributes();
    },

    cancelFeatureEdit: function() {
        if (this.feature.state == OpenLayers.State.INSERT) {
            // remove new feature
            this.editLayer.destroyFeatures([this.feature]);
        }
        else {
            // reset feature
            this.editLayer.drawFeature(this.feature, {display: "none"});
            this.feature.geometry = this.originalFeatureInfo.geometry;
            this.feature.attributes = this.originalFeatureInfo.attributes;
            this.feature.state = this.originalFeatureInfo.state;
            this.editLayer.drawFeature(this.feature);
        }

        // close form
        this.hideFeatureAttributes();
    },

    checkFormIsValid: function() {
        // disable save button if form has invalid values
        this.editFormSaveButton.setDisabled(!this.editFormPanel.getForm().isValid());
    },

    toggleEditWidgets: function(enabled) {
        this.editLayerCombobox.setDisabled(!enabled);
        for (var i=0; i<this.toolButtons.length;i++) {
            this.toolButtons[i].setDisabled(!enabled);
        }
    },

    resizeItems: function(panel, width, height) {
        var innerWidth = width - 2 * this.bodyPadding;
        for (var i=0; i<this.resizableItems.length; i++) {
            this.resizableItems[i].width = innerWidth;
        }
        this.doLayout();
    },

    resizeFormItems: function(panel, width, height) {
        var form = panel.down('form');
        if (form != null) {
            var innerWidth = width - 2 * panel.bodyPadding - 2;
            var formItems = form.items.items;
            for (var i=0; i<formItems.length; i++) {
                var formItem = formItems[i];
                formItem.width = innerWidth;
            }
        }
    },

    beforeDestroy: function () {
        // cleanup
        this.removeSnappingLayer();
        this.removeEditLayer();
    }
});

/*
    Sample usage:

    var map = new OpenLayers.Map();

    var item_config =
    {
        xtype: 'gb-featureeditpanel',
        map: map,
        editLayers: [
            {
                name: "LiWa",
                url: "/geo/aln_fns_apliwa_pflege_fs.json",
                geomType: "Polygon",
                formItems: [
                    {
                        fieldLabel: "objectid",
                        name: "objectid",
                        xtype: 'displayfield'
                    },
                    {
                        fieldLabel: "Eingriffsart",
                        name: "liwaeingriff",
                        xtype: 'combobox',
                        store: {
                            fields: ["text", "value"],
                            data: [
                                {text: "Vorpflege - Entbuschen", value: "16"},
                                {text: "Vorpflege - Problemarten bekämpfen", value: "15"},
                                {text: "Vorpflege - Ringeln", value: "14"}
                            ]
                        }
                    },
                    {
                        fieldLabel: "Ausführungsjahr",
                        name: "liwaeingriffjahr",
                        xtype: 'numberfield'
                    }
                ],
                snappingLayers: [
                    {
                        name: "LiWa",
                        url: "/geo/aln_fns_apliwa_pflege_fs.json",
                        maxScale: 5000
                    }
                ],
                copyLayers: [
                    {
                        name: "LiWa",
                        url: "/geo/aln_fns_apliwa_pflege_fs.json"
                    }
                ]
            }
        ]
    }
*/
