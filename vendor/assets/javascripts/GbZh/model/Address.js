Ext.define('GbZh.model.Address', {
	extend: 'Ext.data.Model',
	alias: 'widget.gb-address',

	fields: [
		'str_name',
		'post_nr',
		'plz',
		'ort',
		'x',
		'y'
	],
	proxy: {
		type: 'ajax',
		url: '../../search/adresse.json',
		reader: {
			type: 'json',
			root: 'features'
		}
	}
});