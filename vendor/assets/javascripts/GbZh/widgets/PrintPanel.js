Ext.define('GbZh.widgets.PrintPanel', {
	extend: 'Ext.form.Panel',
	requires: ['GbZh.geoext.PrintPage', 'GbZh.geoext.PrintExtent', 'GbZh.geoext.PrintProvider', 'GbZh.base.ViewerState'],

	bodyPadding: 5,
	title: 'DruckForm',
	alias: 'widget.gb-printpanel',
	config: {
		url: '/'
	},
	mapComponent: null,

	printExtent: null,
	busyMask: null,
	creatingPdfText: "PDF wird erzeugt...",



	initComponent: function () {
/*
		var printProvider = Ext.create('GbZh.geoext.PrintProvider', {
            method: "POST",
            url: this.url + 'print',
            autoLoad: true
        });

        this.printExtent = Ext.create('GbZh.geoext.PrintExtent', {
            printProvider: printProvider
        });

        this.printExtent.addPage();
		var printPage = this.printExtent.page;
 */
		//		this.printExtent = map.
/*
		var mapComponent = Ext.getCmp('mapcomponent');
		var printPage = mapComponent.plugins[0].page;
	
 */
		//		var www = Ext.getCmp('mapcomponent');
		//		printProvider = www.plugins[0].print();
		var me = this;
		var printProvider = Ext.create('GbZh.geoext.PrintProvider', {
			method: "POST",
			url: this.url + '/print',
			autoLoad: true,
			pluginId: 'printextentplugin'
		});

		var mapPlugin = Ext.create('GbZh.geoext.PrintExtent', {
			printProvider: printProvider
		});


		var mapComponent = Ext.getCmp('mapcomponent');

		if (mapComponent.plugins) {
			mapComponent.plugins.push(mapPlugin);
		} else {
			mapComponent.plugins = [mapPlugin];
		}
		//HACK		
		mapComponent.plugins[0].init(mapComponent);
		this.printExtent = mapPlugin;
//		this.printPage = this.printExtent.page;
//		this.printPage.on('change', this.onPrintActivate, this);
//		GbZh.base.ViewerState.on('change', this.onPrintPageChanged, this);


		//		this.printExtent = mapPlugin;
		//		this.printExtent = mapComponent.plugins[0];
		//		var printExtent = mapComponent.getPlugin('printextentplugin');
		//		this.printPage = this.printExtent.page;
/*
		var f = Ext.getCmp('rotation');
		var p = Ext.create('GbZh.geoext.PrintPageField', {
					printPage: this.printPage
				})
	   if (f.plugins) {
   f.plugins.push(p);
} else {
   f.plugins = [p];
}
 */

		this.on("activate", this.onPrintActivate, this);
		this.on("deactivate", this.onPrintDeactivate, this);

		//		GbZh.base.ViewerState.fireEvent('printextenttoggled', tab == printPanel);
		//		GbZh.base.ViewerState.fireEvent('printextenttoggled', true);
		//       GbZh.base.ViewerState.on('printextenttoggled', this.togglePrintExtent, this);
		GbZh.base.ViewerState.on('printactivate', this.onPrintActivate, this);
		this.printExtent.printProvider.on('loadcapabilities', this.onLoadCapabilities, this);


		if (!this.busyMask) {
            this.busyMask = new Ext.LoadMask(Ext.getBody(), {
                msg: this.creatingPdfText
            });
        }

        this.printExtent.printProvider.on({
            "beforeprint": this.busyMask.show,
            "printexception": this.onPrintException,
            "print": this.busyMask.hide,
            scope: this.busyMask
        });

		me.callParent(arguments);
		//		this.togglePrintExtent(true);
		// GbZh.base.ViewerState.fireEvent('printextenttoggled', true);
	},

	onPrintException: function () {
		this.hide();
		Ext.Msg.alert('Fehler', 'Drucken gescheitert.');
	},

	onPrintPageChanged: function (e) {
		//LOG console.log('onPrintPageChanged!');
		Ext.getCmp('rotation').setValue(e.rotation);
	},

	onPrintActivate: function () {
		//LOG console.log('onPrintActivate!');
		this.printExtent.show();
	},
	
	onPrintDeactivate: function () {
		//LOG console.log('onPrintDeactivate!');
		GbZh.base.ViewerState.fireEvent('printdeactivated', true);
		this.printExtent.hide();
	},

	onLoadCapabilities: function () {
		//LOG console.log('*********************************** onLoadCapabilities!');
		this.buildItems();
	},

	buildItems: function () {
		this.add([{
			xtype: 'textfield',
			id: 'user_title',
			value: '',
			fieldLabel: 'Titel',
			anchor: '100%'
		}, {
			xtype: 'textfield',
			id: 'user_comment',
			value: '',
			fieldLabel: 'Kommentar',
			anchor: '100%'
		}, {
			xtype: 'combobox',
			store: this.printExtent.printProvider.layouts,
			id: 'layouts',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'name',
			fieldLabel: 'Orientierung',
			forceSelection: true,
			anchor: '100%',
			listeners: {
                            select: function(combo, records, opts) {
                                this.setLayout(records[0]);
			    },
			    scope: this.printExtent.printProvider
			}
		}, {
			xtype: 'combobox',
			store: this.printExtent.printProvider.dpis,
			id: 'dpis',
			queryMode: 'local',
			displayField: 'value',
			valueField: 'value',
			fieldLabel: 'Auflösung',
			forceSelection: true,
			autoSelect: true,
			anchor: '100%',
			listeners: {
                            select: function(combo, records, opts) {
                                this.setDpi(records[0]);
			    },
			    scope: this.printExtent.printProvider
			},
			listConfig: {
				getInnerTpl: function () {
					return '{value} dpi';
				}
			}
/*,
				 plugins: Ext.create('GbZh.geoext.PrintPageField', {
					printPage: printPage
				}) */
		}, {
			xtype: 'combobox',
			store: this.printExtent.printProvider.scales,
			displayField: 'name',
			valueField: 'value',
			queryMode: 'local',
			id: 'scale',
			name: 'scale',
			value: 10000,
			plugins: Ext.create('GbZh.geoext.PrintPageField', {
				printPage: this.printExtent.printPage
			}),
			fieldLabel: 'Massstab',
			anchor: '100%'
		}, {
			xtype: 'numberfield',
			id: 'rotation',
			name: 'rotation',
			value: 0,
			fieldLabel: 'Rotation',
			anchor: '100%',
			plugins: Ext.create('GbZh.geoext.PrintPageField', {
				printPage: this.printExtent.printPage
			})

		}, {
			xtype: 'combobox',
			store: this.printExtent.printProvider.outputFormats,
			id: 'outputFormats',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'name',
			fieldLabel: 'Format',
			forceSelection: true,
                        autoSelect: true,
			anchor: '100%',
			listeners: {
                            select: function(combo, records, opts) {
                                this.setOutputFormat(records[0]);
			    },
			    scope: this.printExtent.printProvider
			}
		}, {
			xtype: 'button',
			text: 'Druckbereich zurücksetzen',
			handler: function (b, e) {
				this.printExtent.page.setRotation(0);
				this.printExtent.fitPage();
			},
			scope: this
		}, {
			xtype: 'button',
			text: 'Drucken',
			handler: function () {
				if (this.printExtent.page !== null) {
					this.printExtent.page.customParams = {
						header_img: 'http://127.0.0.1/images/print_logo.gif',
						topic_title: GbZh.base.ViewerState.currentTopic.title,
						user_title: Ext.getCmp('user_title').getValue(),
						user_comment: Ext.getCmp('user_comment').getValue()
					};
					this.printExtent.print();
				}
			},
			scope: this
		}]);
		this.setFirstValue('layouts');
		this.setFirstValue('dpis');
		this.setFirstValue('outputFormats');
	},

	setFirstValue: function (combobox) {
		var c = Ext.getCmp(combobox);
		c.setValue(c.store.getAt(0));
	},


	togglePrintExtent: function (visible) {
/* //HACK: weil die Map beim ersten Mal gefehlt hat
		var mapComponent = Ext.getCmp('mapcomponent');
//		mapComponent.map.addLayer(mapComponent.plugins[0].layer);
		this.printExtent = mapComponent.plugins[0];
 */
		if (visible) {
			if (this.printExtent.page === null) {
				this.printExtent.addPage();
				// add print form fields only after creating print provider and page
				//               this.addPrintFormFields();
			}
			this.printExtent.show();
			this.printExtent.fitPage();
		} else {
			this.printExtent.hide();
		}
	}

});

/*
					var jsjs = {
						units: "m",
						srs: "EPSG:21781",
						layout: "A4 portrait",
						dpi: 150,
						layers: [
							{
								baseURL: "http://web.maps.zh.ch/wms/GB-ARPStand",
								opacity: 1,
								singleTile: true,
								type: "WMS",
								layers: [
									"ueberbauungsstand-2009",
									"wald",
									"siedlung",
									"seen25",
									"gemeinden",
									"fluesse",
									"bahn",
									"lk500",
									"lk200",
									"lk100",
									"lk50",
									"lk25",
									"upcat",
									"provisorisch-platzierte-adressen",
									"adressen"
								],
								format: "image/png",
								styles: [
									""
								],
								customParams: {
									TRANSPARENT: true
								}
							}
						],
						pages: [
							{
								center: [
									682152.87517531,
									246711.0799439
								],
								scale: 25000,
								rotation: 19,
								header_img: "http://web.maps.zh.ch/images/print_header.gif",
								topic_title: "&Uuml;berbauungsstand 2008",
								user_title: "Titel",
								user_comment: "Kommentar"
							}
						]
					};

					Ext.Ajax.request({
						url: '/print/create.json',
						method: 'POST',
						params: Ext.JSON.encode(jsjs),
						headers: { 'Content-Type': 'application/json; charset=utf-8' },
						success: function(response) {
							// In IE, using a Content-disposition: attachment header
							// may make it hard or impossible to download the pdf due
							// to security settings. So we'll display the pdf inline.
							var url = Ext.JSON.decode(response.responseText).getURL +
								(Ext.isIE ? "?inline=true" : "");
							if(Ext.isOpera || Ext.isIE) {
								// Make sure that Opera and IE don't replace the
								// content tab with the pdf
								window.open(url);
							} else {
								// This avoids popup blockers for all other browsers
								window.location.href = url;                        
							} 
							this.fireEvent("print", this, url);
						},
						failure: function(response) {
							me.fireEvent("printexception", this, response);
						},
					}); */