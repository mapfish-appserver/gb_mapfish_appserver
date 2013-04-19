Ext.define('GbZh.widgets.WmsLayerGrid', {
	extend: 'Ext.grid.Panel',
	alias: 'widget.gb-wmslayergrid',
	requires: ['GbZh.store.WmsLayers', 'GbZh.model.WmsLayer'],

	title: 'Layers',

	//	autoExpandColumn: 'title-col',
	initComponent: function () {
		this.store = GbZh.store.WmsLayers;
		this.columns = this.buildColumns();
		this.callParent(arguments);
	},

	buildColumns: function () {
		return [{
			header: 'id',
			dataIndex: 'id'
		}, {
			header: 'layername',
			dataIndex: 'layername'
		}, {
			header: 'topic',
			dataIndex: 'topic'
		}, {
			header: 'groupname',
			dataIndex: 'groupname'
		}, {
			header: 'toclayertitle',
			dataIndex: 'toclayertitle'
		}, {
			header: 'leglayertitle',
			dataIndex: 'leglayertitle'
		}, {
			header: 'showscale',
			dataIndex: 'showscale'
		}, {
			header: 'minscale',
			dataIndex: 'minscale'
		}, {
			header: 'maxscale',
			dataIndex: 'maxscale'
		}, {
			header: 'docuurl',
			dataIndex: 'docuurl'
		}, {
			header: 'legendhtml',
			dataIndex: 'legendhtml'
		}, {
			header: 'wms',
			dataIndex: 'wms'
		}, {
			header: 'wms_sort',
			dataIndex: 'wms_sort'
		}, {
			header: 'visini',
			dataIndex: 'visini'
		}, {
			header: 'visuser',
			dataIndex: 'visuser'
		}, {
			header: 'showtoc',
			dataIndex: 'showtoc'
		}, {
			header: 'query_sort',
			dataIndex: 'query_sort'
		}];
	}

});