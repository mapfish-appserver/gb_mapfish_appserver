Ext.define('GbZh.model.GeoLionProduct', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'gddnr', type: 'string' },
		{ name: 'title', type: 'string' },
		{ name: 'beschreibung', type: 'string' },
		'list'
	],
/*
	associations: [
        {
			type: 'hasMany',
			model: 'GbZh.model.GeoLionDataSet',
			getterName: 'getGeoLionDataSet',
			primaryKey: 'gdpnr'
		}
    ],
 */
	proxy: {
		type: 'jsonp',
		url: GbZh.base.ViewerState.geoLionHost + '/geodatensatz/getmetagdd.json',
		extraParams: {
			nr: 4
		},
		reader: {
			type: 'json',
			root: 'results'
		}
	},
	listeners: {
/*
beforeload: function(){
			var params = store.getProxy().extraParams;
			if (params.query) {
				delete params.nr;
			} else {
				params.nr = nr;
			}
		}
 */
	}
});
