Ext.define('GbZh.model.SwissnamesSearch', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'service', type: 'string' },
		{ name: 'objectorig', type: 'string' },
		{ name: 'rank', type: 'int' },
		{ name: 'label', type: 'string' },
		{ name: 'bbox', type: 'auto' },
		{ name: 'id', type: 'auto' }
	],
	proxy: {
		type: 'jsonp',
		url : 'http://api.geo.admin.ch/swisssearch/geocoding',
/*
		extraParams: 
			{ format: 'raw', kanton: 'ZH' }
		,
 */
		callbackKey: 'cb',
		reader: {
			type: 'json',
			root: 'results'
		}
	}
});
