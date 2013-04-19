Ext.define('GbZh.widgets.InfoPanel', {
    extend: 'Ext.panel.Panel',
	requires: ['GbZh.base.ViewerState'],
	alias: 'widget.gb-infopanel',
	ost: 0,
	nord: 0,

	initComponent: function () {
		GbZh.base.ViewerState.on('identifyclicked',  this.showXy, this, this);
		GbZh.base.ViewerState.on('featurequeryresultsready',  this.showResults, this, this);
		this.callParent(arguments);
	},

	showXy: function (ost, nord) {
		Ext.DomQuery.selectNode('#info-body').innerHTML = '<div class="infokoord"><b>Informationen</b> für ausgewählte Themen bei Koordinate ' + Math.round(ost) + ' / ' + Math.round(nord);
		this.ost = ost;
		this.nord = nord;
		this.setLoading('Laden der Infos');

	},

	showResults: function (result) {
		var i, len;
		if (result.code === 1) {
			var res = '';
			if (result.features && result.features.length) {
				for (i = 0, len = result.features.length; i < len; ++i) {
					res += result.features[i].data;
				}
				Ext.DomQuery.selectNode('#info-body').innerHTML = res;
			} else {
				this.setHtml("leer");
			}
		} else {
			this.setLoading(false);
		}
		Ext.DomQuery.selectNode('#infoxy').innerHTML =  Math.round(this.ost) + ' / ' + Math.round(this.nord);
		this.setLoading(false);

	}
});
