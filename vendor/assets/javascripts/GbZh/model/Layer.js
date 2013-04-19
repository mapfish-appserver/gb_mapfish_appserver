Ext.define('GbZh.model.Layer', {
	extend: 'Ext.data.Model',
	requires: ['GbZh.store.LayerReader'],
	alias: 'widget.gb-layer',

	fields: [
			// The name given for the layer
		{ name: 'name' },
			// The layer instance
		{ name: 'layer' }
	],

	proxy: {
		type: 'memory',
		reader: Ext.create('GbZh.store.LayerReader', ({}))
	}
});