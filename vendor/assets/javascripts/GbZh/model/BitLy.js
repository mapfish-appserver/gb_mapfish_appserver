Ext.define('GbZh.model.BitLy', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'status_code', type: 'number' },
		{ name: 'status_txt', type: 'string' },
		{ name: 'data', type: 'string' },
		{ name: 'url', type: 'string' }
	],
	proxy: {
		type: 'jsonp',
		url : 'http://api.bitly.com/v3/shorten?login=aquilo&apiKey=R_5279a97c3d1c4fb1f59f7b776c1ed569',
		reader: {
			type: 'json',
			root: '',
			record: 'data'
		}
	}
});
