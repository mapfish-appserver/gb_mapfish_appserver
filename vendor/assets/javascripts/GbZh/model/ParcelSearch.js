Ext.define('GbZh.model.ParcelSearch', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'lkx', type: 'string' },
		{ name: 'lky', type: 'string' },
		{ name: 'geodb_oid', type: 'string' },
		{ name: 'bsname', type: 'string' },
		{ name: 'gemeinde', type: 'string', sortType: 'asUCText' }
	],
	proxy: {
		type: 'ajax',
		url: '../../search/parzelle.json',
		reader: {
			type: 'json',
			root: 'features'
		}
	}
});
