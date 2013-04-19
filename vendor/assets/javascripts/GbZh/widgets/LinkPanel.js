Ext.define('GbZh.widgets.LinkPanel', {
    extend: 'Ext.panel.Panel',
	requires: [
		'GbZh.base.ViewerState',
		'GbZh.store.BitLys',
		'GbZh.model.BitLy'
	],
	alias: 'widget.gb-linkpanel',
//	store: Ext.create('GbZh.store.BitLys'),
	config: {
		map: {}
	},
	title: 'Link',
	bodyPadding: 5,
	items: [
		{
			xtype: 'label',
			text: 'Direkter Link auf diese Karte'
		},
		{
			xtype: 'textfield',
			width: 600,
			id: 'permalink',
			selectOnFocus: true
		},
		{
			xtype: 'checkboxfield',
			fieldLabel: '',
			boxLabel: 'verkürzte URL',
			listeners: {
				change: function (a, shortChecked, c, d, e, f) {
					Ext.getCmp('link').showLink(shortChecked);
				},
				scope: this.parent
			}
		},
		{
			xtype: 'label',
			html: '<div id="twitter"></div>',
			id: 'twitter'
		}
	],

	initComponent: function () {
		this.store = Ext.create('GbZh.store.BitLys');
		var me = this;
		this.callParent(arguments);
		this.store.on('load', this.setLink, this);
		this.showLink(false);
		if (this.map) {
			if (this.map instanceof GbZh.widgets.MapComponent) {
				this.map = this.map.map;
			}
			this.bind(this.map);
		}
		this.on("beforedestroy", this.unbind, this);
	},

	bind: function (map) {
		this.map = map;
		this.map.events.on({
			zoomend: this.close,
			moveend: this.close,
			scope: this
		});
	},

	goAway: function () {
		//LOG console.log("go away");
		this.hide();
	},

	unbind: function () {
		this.map = null;
	},

	setLink: function (store, record, success) {
		var fld = Ext.getCmp('permalink');
		if (success) {
			fld.setValue(record[0].data.url);
			fld.focus(true);
			this.doTwitterLink();
		}
	},

	doTwitterLink: function () {
		Ext.getCmp('twitter').setText('<a href="https://twitter.com/intent/tweet?text=Karte im GIS-Browser auf ' +
			encodeURIComponent(location.host + ": ") +
			'&url=' + encodeURIComponent(Ext.getCmp('permalink').value) +
			'&hashtags=GISZH" target="_blank"><img src="/img/twitter.png"></a>', false);
	},

	showLink: function (shortTxt) {
		var fld = Ext.getCmp('permalink');
		var pnl = Ext.getCmp('link');
		if (shortTxt) {
			pnl.store.model.proxy.url = 'http://api.bitly.com/v3/shorten?login=aquilo&apiKey=R_5279a97c3d1c4fb1f59f7b776c1ed569&longUrl=' +
				encodeURIComponent(GbZh.base.ViewerState.permalink());
			pnl.store.load();
		} else {
			fld.setValue(GbZh.base.ViewerState.permalink());
		}
		fld.focus(true);
		this.doTwitterLink();
	}
});
