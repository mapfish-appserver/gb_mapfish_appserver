Ext.define('GbZh.widgets.SwissnamesSearchComboBox', {
	extend: 'Ext.form.field.ComboBox',
	alias: 'widget.gb-swissnamessearchcombobox',
	emptyText: 'Ortschaft, Adresse, PLZ ...',
	enableKeyEvents: true,
	selectOnFocus: true,
	hideLabel: true,
	hideTrigger: true,
	minChars: 3,
	valueField: 'label',
	displayField: 'label',
	forceSelection: false,
	valueNotFoundText: '',
	scaleForPointAddress: 800.0,
	scaleForPointSwissnames: 25000.0,
	listeners: {
		render: function () {
			Ext.create('Ext.tip.ToolTip', {
				target: 'swissnamessearch',
				html: 'Eingabe: <b>Ort</b>, <b>PLZ</b> oder <b>administrative Einheit</b>'
			});
		},
		select: {
			fn: function (sm, selected, options) {
				//LOG console.log(selected[0].data.bbox);
				var newScale;
				if (selected[0].data.service === 'address') {
					newScale = this.scaleForPointAddress;
				} else if (selected[0].data.service === 'swissnames') {
					newScale = this.scaleForPointSwissnames;
				} else {
					newScale = 1000;
				}
				GbZh.base.ViewerState.fireEvent('searchresultselectedrectangle', '', selected[0].data.bbox[0], selected[0].data.bbox[1], selected[0].data.bbox[2], selected[0].data.bbox[3], newScale);
				this.ohneTags = (selected[0].data.label).replace(/<[\/]?[^>]*>/g, '');
				selected[0].data.label = this.ohneTags;
				//LOG console.log(this.ohneTags);
				this.setValue(this.ohneTags);
			}
		}
	},
	listConfig: {
		loadingText: 'Suche läuft ...',
		emptyText: 'Nichts gefunden.',
		maxHeight: 600
	}
});

/*	
???
	renderTpl: new Ext.XTemplate(
		<tpl if="{bbox[3]} < 222000">
		x {label}</tpl>'
	)
		renderer: function (value, metaData, record, colIndex, rowIndex, store) {
//TODO ev. genauere Definition des ZH-Rectangles
				if ((record.data.bbox[2] < 664000)
						|| (record.data.bbox[3] < 222000)
						|| (record.data.bbox[0] > 718000)
						|| (record.data.bbox[1] > 285000)) {
					return '<span style="color:gray">' + value + '</span>';
				} else {
					return value;
				}
			}
*/