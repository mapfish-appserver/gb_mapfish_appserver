Ext.define('GbZh.model.WmsLayer', {
	extend: 'Ext.data.Model',

	fields:
		[
//			'id',
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
		],

 /*	proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'wmslayers'
        }
    }

 */

	proxy: {
		type: 'ajax',
		url : '',
 //       url : 'http://web.maps.zh.ch/layers.json',
// callbackKey: 'ccbbcc',
// callbackPrefix: 'aabbcc',
        reader: {
			type: 'json',
			root: 'wmslayers',
			idProperty: 'id',
			successProperty: 'success',
			totalProperty: 'results',
			messageProperty: 'messageProperty'
		}
    }

});
