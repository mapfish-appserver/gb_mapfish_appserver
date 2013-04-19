Ext.define('GbZh.widgets.AddressFormPanel', {
	//	requires: ['GbZh.base.ViewerState'],
	extend: 'GbZh.widgets.SearchFormPanel',
	requires: ['GbZh.store.Addresses', 'GbZh.model.Address'],
	alias: 'widget.gb-addressformpanel',

	title: 'Adress-Suche',
	submitUrl: '../../search/adresse.json?',
	store: null,

	initComponent: function () {
		this.store = new GbZh.store.Addresses();
		//LOG console.log(this);
		GbZh.widgets.AddressFormPanel.superclass.initComponent.call(this);
	},

	buildItems: function () {
		return [{
			xtype: 'fieldset',
			autoHeight: false,
			defaultType: 'textfield',
			//				defaults: {anchor: '50%'},
			layout: 'anchor',
			//fieldLabel: 'Strasse / Nr.',
			items: [{
				xtype: 'textfield',
				name: 'strassenname',
				fieldLabel: 'Strasse'
				//						anchor: true,
				//						flex: 1
			}, {
				xtype: 'textfield',
				name: 'hausnummer',
				fieldLabel: 'Nr.',
				maxLength: 6,
				//						anchor: true,
				width: 50
			}]
		}, {
			xtype: 'fieldset',
			//fieldLabel: 'PLZ / Ort',
			items: [{
				xtype: 'numberfield',
				name: 'plz',
				fieldLabel: 'PLZ',
				maxValue: 9000,
				allowDecimals: false,
				allowNegative: false,
				width: 50
			}, {
				xtype: 'combo',
				name: 'ortschaftsname',
				fieldLabel: 'Ort',
				// TODO: fill list
				store: ['Winterthur', 'Wiesendangen', 'Dachsen'],
				flex: 1
			}]
		}];
	},

	dataModel: function () {
		//LOG console.log("datamodel");
		//		return new GbZh.model.Address;
		return new Ext.data.Model({
			id: 'ogc_fid',
			fields: ['str_name', 'post_nr', 'plz', 'ort', 'x', 'y'],
			proxy: {
				type: 'ajax',
				url: '../../search/adresse.json',
				reader: {
					type: 'json',
					root: 'features'
				}
			}
		});
	},

	dataColumns: function () {
		return [{
			header: "Strasse",
			dataIndex: 'str_name'
		}, {
			header: "Nr.",
			dataIndex: 'post_nr',
			width: 32
		}, {
			header: "PLZ",
			dataIndex: 'plz',
			width: 52
		}, {
			header: "Ort",
			dataIndex: 'ort'
		}, {
			header: 'Kombi',
			dataIndex: 'str_name',
			sortable: true,
			flex: 1,
			id: 'title-col',
			renderer: function (value, metaData, record, colIndex, rowIndex, store) {
				return record.data.str_name + " " + record.data.post_nr + ", " + record.data.plz + " " + record.data.ort;
			}
		}];
	},
	onItemDoubleclick: function (grid, record, item, index, e) {
		var lkx = record.data.x;
		var lky = record.data.y;
		//LOG console.log(lkx + " / " + lky);
		// mark and jump to position on map
		//TODO   GbZH.GbEventManager.fireEvent('searchresultselected', 'images/marker.png', lkx, lky, 15000);
	}
});