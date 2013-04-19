Ext.define('GbZh.widgets.ParcelSearchComboBox', {
	extend: 'Ext.form.field.ComboBox',
	alias: 'widget.gb-parcelsearchcombobox',
	emptyText: 'Grundstücksnummer ...',
	enableKeyEvents: true,
	selectOnFocus: true,
	hideLabel: true,
	hideTrigger: true,
	minChars: 1,
	queryParam: 'bsname',
	valueField: 'label',
	displayField: 'bsname',
	forceSelection: true,
	scaleForParcel: 2400.0,
	listeners: {
		'selectxx': function() {
			//LOG console.log('selected: ' + selected[0].data.bsname + ' in ' + selected[0].data.gemeinde);
			GbZh.base.ViewerState.fireEvent('searchresultselected', '/images/identify_marker.png', selected[0].data.lkx, selected[0].data.lky, this.scaleForParcel);
		},
		
//TEST
		beforequery: function(qe){
			//LOG console.log('beforequery');
//            delete qe.combo.lastQuery;
           delete this.lastQuery;
        },

		
		specialkey: function(field, e) {
			//LOG console.log('specialKey: ' + e.getKey());
		},
		render: function () {
			Ext.create('Ext.tip.ToolTip', {
				target: 'parcelsearch',
				html: 'Eingabe: <b>Grundstücksnummer</b>, anschliessend Auswahl der Gemeinde. '
				//				html: 'Eingabe: <b>Grundstücksnummer</b> und <b>Gemeindename</b>, z.B. "123 wil". '
			});
		},
		select: function (sm, selected, options) {
			//LOG console.log('selected: ' + selected[0].data.bsname + ' in ' + selected[0].data.gemeinde);
			//LOG console.log(selected);
			GbZh.base.ViewerState.fireEvent('searchresultselected', '/images/identify_marker.png', selected[0].data.lkx, selected[0].data.lky, this.scaleForParcel);
		}
	},
	listConfig: {
		getInnerTpl: function () {
			return '{bsname} <b>{gemeinde}</b>';
		},
		loadingText: 'Suche läuft ...',
		emptyText: 'Nichts gefunden.',
		maxHeight: 400
	}
});