Ext.define('GbZh.model.GeoLionDataset', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'title', type: 'string' },
		{ name: 'owner', type: 'string' },
		{ name: 'standdate', type: 'string' },
		{ name: 'nachfuehrungstyp', type: 'string' },
		{ name: 'kurzbeschreibung', type: 'string' },
		{ name: 'beschreibung', type: 'string' }
	],

	proxy: {
		type: 'jsonp',
//HACK: so gab es Probleme beim Laden, darum mal fix verdrahtet
//		url: GbZh.base.ViewerState.geoLionHost + '/geodatensatz/getmetagds.json',
		url: 'http://www.geolion.ktzh.ch/geodatensatz/getmetagds.json',
//		url: 'http://160.63.9.23/geolion/geodatensatz/getmetagds.json',
//		url: 'http://cbd300320/geodatensatz/getmetagds.json',
		extraParams: {
			nr: 4
		},
		reader: {
			type: 'json',
			root: 'results'
		}
	}
});
