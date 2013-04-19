Ext.define('GbZh.widgets.InfoTabPanel', {
	extend: 'Ext.tab.Panel',
	requires: [
		'GbZh.base.ViewerState',
		'GbZh.widgets.InfoPanel',
//		'GbZh.widgets.GeoLionPanel',
		'GbZh.widgets.PrintPanel',
                'GbZh.widgets.RedliningPanel',
		'GbZh.widgets.LinkPanel',
		'GbZh.widgets.FeatureEditPanel'
	],
	alias: 'widget.gb-infotabpanel',
	id: 'infotabpanel',
	refs: [{
		selector: 'legendPanelContents',
		ref: 'lll'
	}],
	layout: {
		type: 'fit'
	},
//HACK: weil mit dem SASS-generierten CSS oben immer 24 pixel verschwendet werden: 
	bodyStyle: 'padding: 0px; position: absolute;',

	activeTab: 0,
//TODO: ev. überflüssig
	deferredRender: false,

	initComponent: function () {
		this.items = this.buildItems();
		GbZh.base.ViewerState.on('wmslayerstoreloaded', this.resetTabs, this, this);
//		GbZh.base.ViewerState.on('identifyclicked', this.showInfo, this);
		GbZh.base.ViewerState.on('printactivate', this.showPrint, this, this);
		GbZh.base.ViewerState.on('redliningactivate', this.showRedlining, this, this);
		GbZh.base.ViewerState.on('linkactivate', this.showLink, this, this);
		GbZh.base.ViewerState.on('showmetadata', this.showGeoLion, this, this);
		GbZh.base.ViewerState.on('editactivate', this.showEdit, this, this);
		GbZh.base.ViewerState.on('exportactivate', this.showExport, this, this);
		GbZh.base.ViewerState.on('topicselected', this.cleanupPanels, this, this);
		GbZh.base.ViewerState.on('loadstarted', this.loadStarted, this, this);
		GbZh.base.ViewerState.on('loadended', this.loadEnded, this, this);
		this.callParent(arguments);
	},

	buildItems: function () {
		return [
			{
				xtype: 'panel',
				layout: {
					type: 'accordion'
				},
				title: 'Karteninhalt',
				id: 'mapcontent',
				items: [
					{
						xtype: 'gb-wmslayertreegrid',
						id: 'toc',
						autoRender: true,
						layout: {
							type: 'fit'
						},
						title: 'Ebenen'
					}, {

						xtype: 'gb-legendpanel',
						id: 'legend',
						autoRender: true,
						autoScroll: true,
						title: 'Legende'
					}/* , {
						xtype: 'gb-geolionpanel',
						autoRender: true,
						autoScroll: true,
						id: 'meta',
						title: 'Metadaten'
					} */
				]
			}, {
				xtype: 'gb-infopanel',
				id: 'info',
				title: 'Info',
				autoRender: true,
				autoScroll: true,
				hidden: false,
				html: 'zuerst auf karte klicken'
			}];
	},

	loadStarted: function () {
		this.setLoading("Laden der Karte");
	},

	loadEnded: function () {
		this.setLoading(false);
	},

	resetTabs: function (topic, me) {
		var infotabpanel = Ext.getCmp('infotabpanel');
		infotabpanel.setActiveTab('mapcontent');
		if (Ext.Array.indexOf(GbZh.base.ViewerState.currentTopicRecord.data.tools, "EditTool") >= 0) {
			this.showEdit();
		}
	},

	showGeoLion: function (topic, me) {
		Ext.getCmp('meta').expand();
	},

	showPrint: function (topic, me) {
		if (typeof (this.items.get('print')) === 'undefined') {
			var pp = Ext.create('GbZh.widgets.PrintPanel', {
				url: GbZh.base.ViewerState.serverUrl,
				id: 'print',
				title: 'Drucken',
				hidden: false,
				closable: true
			});
			this.add(pp);
			pp.show();
		} else {
			Ext.getCmp('print').show();
		}
		Ext.getCmp('infotabpanel').setActiveTab('print');
		//		GbZh.base.ViewerState.fireEvent('printextenttoggled', true);
	},

	showRedlining: function (setActive, me) {
		var activeTab = Ext.getCmp('infotabpanel').getActiveTab();
		if (typeof (this.items.get('redlining')) === 'undefined') {
			var pp = Ext.create('GbZh.widgets.RedliningPanel', {
				id: 'redlining',
				title: 'Redlining',
				hidden: false,
				closable: true,
                                map: GbZh.base.ViewerState.currentMap
			});
			this.add(pp);
			pp.show();
		} else {
			Ext.getCmp('redlining').show();
		}
		Ext.getCmp('infotabpanel').setActiveTab(setActive ? 'redlining' : activeTab);
    },

	showLink: function () {
		if (typeof (this.items.get('link')) === 'undefined') {
			var pp = Ext.create('GbZh.widgets.LinkPanel', {
				id: 'link',
				title: 'Link',
				hidden: false,
				closable: true,
				map: GbZh.base.ViewerState.currentMap
			});
			this.add(pp);
		}
		Ext.getCmp('link').show();
		Ext.getCmp('infotabpanel').setActiveTab('link');
		Ext.getCmp('permalink').focus(true);
	},

	showEdit: function (editLayers0) {
// Statt showEdit via Button aufzurufen und die Config zu übergeben, wird hier die Config erst hier
		var editLayersConfig = edit_configs[GbZh.base.ViewerState.currentTopic.name];
		if (editLayersConfig === null) {
			editLayersConfig = [];
		}
		var editLayers = editLayersConfig;
		if (!Ext.isDefined(editLayers)) {
			//LOG console.log('no editconfig for ' + GbZh.base.ViewerState.currentTopic.name);
			return;
		}

		if (!Ext.isDefined(this.items.get('edit'))) {
			var pp = Ext.create('GbZh.widgets.FeatureEditPanel', {
				id: 'edit',
				title: 'Editieren',
				closable: false,
				map: GbZh.base.ViewerState.currentMap,
				editLayers: editLayers
			});
			this.add(pp);
		}
//		this.setActiveTab('edit');
	},

	showExport: function (exportLayers) {
		if (typeof (this.items.get('export')) === 'undefined') {
			var pp = Ext.create('GbZh.widgets.FeatureExportPanel', {
				id: 'export',
				title: 'Exportieren',
				closable: true,
				map: GbZh.base.ViewerState.currentMap,
				exportLayers: exportLayers
			});
			this.add(pp);
		}
		this.setActiveTab('export');
	},

	cleanupPanels: function () {
                this.removePanel('redlining');
		this.removePanel('edit');
		this.removePanel('export');
	},

	removePanel: function (id) {
		var panel = this.items.get(id);
		if (panel) {
			panel.close();
		}
	}
});
