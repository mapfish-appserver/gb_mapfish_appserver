Ext.define('GbZh.widgets.WmsLayerTreeGrid', {
	extend: 'Ext.tree.TreePanel',
	alias: 'widget.gb-wmslayertreegrid',
	requires: ['GbZh.store.WmsLayers', 'GbZh.model.WmsLayerTree'],
	id: 'wmsLayerTreePanel',

	title: 'Ebenen',

/*
		plugins: [{
            ptype: 'rowexpander',
            rowBodyTpl : [
                '<p><b>Company:</b> xxx</p><br>',
                '<p><b>Summary:</b> yyy</p>'
            ]
        }],
 */

	rootVisible: false,
	userArrows: true,

	columns: [
/* 
		{
			text: 'hoi',
			dataIndex: 'minscale',
			renderer: function  ( value, meta, record, rowIndex, colIndex, store)
		{
		meta.style = "height:auto !important";
		return '<img src="http://www.sencha.com/img/sencha-large.png">';
}
	}, */
		{
			xtype: 'treecolumn',
			//this is so we know which column will show the tree
			text: 'Layer',
			flex: 2,
			sortable: false,
			dataIndex: 'toclayertitle'
		}, {
			xtype: 'templatecolumn',
			text: 'Massstab',
			flex: 1,
			sortable: false,
			dataIndex: 'minscale',
			align: 'center',
			tpl: Ext.create('Ext.XTemplate', '<div class="hiddenscales">{minscale:this.writeMin} {maxscale:this.writeMax}</div>', {
				writeMin: function (v) {
					if (v === undefined) {
						return '';
					}
					return (v !== "") ? (v + ' - ') : '';
				},
				writeMax: function (v) {
					return v;
				}
			})
		}],


	initComponent: function () {
		this.store = this.buildEmptyTreeStore();
		GbZh.base.ViewerState.on('wmslayerstoreloaded', this.updateTreeStore, this);
		GbZh.base.ViewerState.on('mapscalechanged', this.activateLayersFromScale, this);
		this.callParent(arguments);
/*
		Ext.util.Observable.capture(this, function (e, params) {
			//LOG console.log('TreeGrid-event: ' + e);
			if (typeof (params) === 'object') {
				//LOG console.log(params);
			}
		});
*/
		this.on('checkchange', this.onCheckChange, this);
	},

	updateTreeStore: function () {
		//TODO: Behandlung der Overlays und Bases
		this.collapseAll();
		this.buildOverlayBranch(null);
		var s = GbZh.store.WmsLayers;
		s.sort('wms_sort', 'DESC');
		this.buildMainBranch(s);
//		this.buildMainBranch(GbZh.store.WmsLayers);
		this.buildBaseBranch(null);
		this.expandAll();
		this.view.refresh();
	},

	buildEmptyTreeStore: function () {
		var ts = Ext.create('Ext.data.TreeStore', {
//		model: GbZh.model.WmsLayerTree,
			root: {
				expanded: true
			}
		});
		return ts;
	},

	buildOverlayBranch: function (wmsLayerStore) {
		return this.buildBranch(wmsLayerStore, true, false, false, 'Overlay-Ebenen', 'overlay');
	},

	buildMainBranch: function (wmsLayerStore) {
		return this.buildBranch(wmsLayerStore, false, true, false, 'Ebenen', 'ebenen');
	},

	buildBaseBranch: function (wmsLayerStore) {
		return this.buildBranch(wmsLayerStore, false, false, true, 'Basis', 'basis');
	},

	buildBranch: function (wms, overlay, main, base, text, id) {
		var node;
		node = this.store.getNodeById(id);
		if (node !== undefined) {
			node.removeAll();
		} else {
			node = this.store.getRootNode();
			node.appendChild({
				toclayertitle: text,
				id: id,
				leaf: false
			});
		}
		if (wms === null) {
			return;
		}
		node = this.store.getNodeById(id);

		//TODO: noch nicht gelöst (bräuchte ev. weitere variablen 
		//		wms.filter('id', 'true');
		var groupold = '';
		var niveau = 0;
		wms.each(function (r) {
			if (r.data.groupname !== groupold) {
				if (niveau > 0) {
					node = node.parentNode;
					niveau = niveau - 1;
				}
				if (r.data.groupname !== null) {
					node = node.appendChild({
						toclayertitle: r.data.groupname,
						id: r.data.groupname,
						leaf: false,
						checked: r.data.visini,
						topic: r.data.topic
					});
					niveau = niveau + 1;
				}
				groupold = r.data.groupname;
			}
			var n = {
				toclayertitle: r.data.toclayertitle,
				id: r.data.toclayername,
				leaf: true,
				checked: r.data.visini,
				topic: r.data.topic,
				layername: r.data.layername,
				minscale: r.data.minscale,
				maxscale: r.data.maxscale
			};
			n.qtip = '<b>' + r.data.toclayertitle + '</b>,<br>sichtbar in den Massstäben<br>1:'
				+ r.data.minscale + " bis 1:" + r.data.maxscale
				+ '<br>(Layername: \'' + r.data.layername + '\')';
			node.appendChild(n);
		}, {
			layerTreeGrid: this
		});
		this.activateLayersFromScale();
	},

	activateLayersFromScale: function () {
		var scale = GbZh.base.ViewerState.map.getScale();
		this.store.getRootNode().cascadeBy(function (node) {
			if (node.data.leaf) {
				if ((scale >= node.data.minscale) && (scale <= node.data.maxscale)) {
					node.data.cls = 'x-item-enabled';
				} else {
					node.data.cls = 'x-item-disabled';
				}
			} else {
				node.data.cls = 'x-item-enabled';
			}
		});
		this.view.refresh();
	},

	layerCheckChange: function (node, checked) {
		GbZh.store.WmsLayers.setTopicLayerVisibility(node.data.topic, [node.data.layername], checked);
	},

	rootCheckChange: function (root, checked) {
		// check all children
		root.cascadeBy(function (node) {
			var checked = this.data.checked;
			if (node.data.checked !== checked) {
				node.data.checked = checked;
			}
		}, root);

		// update all layer visibilities at once, not for each changed child separately
		GbZh.store.WmsLayers.setTopicVisibility(root.data.topic, checked);
	},

	groupCheckChange: function (group, checked) {
		var topic;
		var layerNames = [];
		group.cascadeBy(function (node) {
			node.data.checked = checked;
			if (node.isLeaf()) {
				topic = node.data.topic;
				layerNames.push(node.data.layername);
			}
		}, {
			checked: checked,
			layerNames: layerNames
		});
		this.view.refresh();
		GbZh.store.WmsLayers.setTopicLayerVisibility(topic, layerNames, checked);
	},

	onCheckChange: function (node, checked, eOpts) {
		//LOG console.log("*************************************");
		//LOG console.log(node);
		//LOG console.log(checked);
		//LOG console.log(eOpts);
		if (node.isLeaf()) {
			this.layerCheckChange(node, checked);
		} else {
			this.groupCheckChange(node, checked);
		}
	}

});