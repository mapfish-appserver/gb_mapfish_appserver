Ext.define('GbZh.model.WmsLayerTree', {
	extend: 'Ext.data.Model',

	fields:
		[
			'id',
			'layername',
			'topic',
			'groupname',
			'toclayertitle',
			'leglayertitle',
			{ name: 'showscale', type: 'bool' },
			{ name: 'minscale', type: 'int' },
			{ name: 'maxscale', type: 'int' },
			'docuurl',
			'legendhtml',
			{ name: 'wms', type: 'bool' },
			{ name: 'wms_sort', type: 'int' },
			{ name: 'visini', type: 'bool' },
			{ name: 'visuser', type: 'bool' },
			{ name: 'showtoc', type: 'bool' },
			{ name: 'query_sort', type: 'int' }
		]

});
