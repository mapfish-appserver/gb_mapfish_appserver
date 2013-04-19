Ext.define('GbZh.widgets.GeoLionPanel', {
	extend: 'Ext.panel.Panel',
	requires: [
		'GbZh.store.GeoLionProducts',
		'GbZh.model.GeoLionProduct',
		'GbZh.store.GeoLionDatasets',
		'GbZh.model.GeoLionDataset'
	],
	alias: 'widget.gb-geolionpanel',
	bodyPadding: 5,
	title: 'GeoLion',
	store: {},
	storeP: {},
	storeS: {},
	items: [],
	nummer: 0,
	backNummer: 0,

	initComponent: function () {

		this.callParent(arguments);

		this.storeP = Ext.create('GbZh.store.GeoLionProducts');
		this.storeS = Ext.create('GbZh.store.GeoLionDatasets');

		this.store = this.storeP;

		var viewP = Ext.create('Ext.view.View', {
			store: this.storeP,
			id: 'iiiiP',
			itemSelector: 'div.geolionP-wrap',
			tpl: new Ext.XTemplate(
				'<tpl for=".">',
				'<div style="margin-bottom: 10px;" class="geolionP-wrap">',
				'<h1>{title}</h1>',
				'<br/><span>{beschreibung}</span><hr><dl>',
				'<tpl for="list"><br>',
				'<dt><b>{title}</b></dt>',
				'<dd>{kurzbeschreibung}, <a href="{geocatlink}" target="_blank">GeoCat</a>, ',
				'<a href="#" onclick="GbZh.base.ViewerState.fireEvent(\'showmetadata\', \'S\', \'{gdsnr}\', \'{[Ext.getCmp("meta").nummer]}\')">Details</a> ...</dd>',
				'</tpl></dl>',
				'</div>',
				'</tpl>'
			)
		});

		var viewS = Ext.create('Ext.view.View', {
			store: this.storeS,
			id: 'iiiiS',
//			itemSelector: 'div.geolionS-wrap',
			itemSelector: 'div.metadata',
			tpl: new Ext.XTemplate(
				'<a href="#" onclick="GbZh.base.ViewerState.fireEvent(\'showmetadata\', \'P\', \'{[Ext.getCmp("meta").backNummer]}\')">zurück</a><br/><br/>',
				'<tpl for=".">',
//				'<div style="margin-bottom: 10px;" class="geolionS-wrap">',
				'<div style="margin-bottom: 10px;" class="metadata">',
				'<h1>{title}</h1>',
				'<span>{owner}</span><br/>',
				'<span><i>Stand: {standdate}</i></span><br/>',
				'<span>Nachführung: {nachfuehrungstyp}</span><br/><br/>',
				'<span><b>{kurzbeschreibung}</b></span><br/><br/>',
				'<span>{beschreibung}</span><br/>',
				'</div>',
				'</tpl>'
			),
			hidden: true
		});

		this.add(viewP);
		this.add(viewS);

		GbZh.base.ViewerState.on('showmetadata', this.doShow, this);
	},

	doShow: function (kind, nr, nrback) {
//TODO: Nummer aus Tabelle verwenden
		this.nummer = nr;
		this.backNummer = nrback;
		if (kind === "P") {
			this.store = this.storeP;
			this.items.items[1].hide();
			this.items.items[0].show();
		} else {
			this.store = this.storeS;
			this.items.items[0].hide();
			this.items.items[1].show();
		}
		this.store.proxy.extraParams.nr = nr;
		this.store.load();
		// var mmm = Ext.get('metadata');
		// mmm.load({
			// url: 'http://cbd300320/geodatensatz/getmetagds.json?nr=235'
	// });
	// mmm.show();

/*
		this.store.load(4, {
			success: function(prod) {
			//LOG console.log("Product: " + prod.get('title'));
	 
			this.store.getGeoLionDataset().each(function(ds) {
				//LOG console.log("ds for proc: " + ds.get('title'));
	 
		});
 */
	}
});

