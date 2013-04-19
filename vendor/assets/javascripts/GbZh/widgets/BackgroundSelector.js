Ext.define('Background', {
	extend: 'Ext.data.Model',
	fields: [
		{type: 'string', name: 'backgroundlayer'}
    ]
});

var backgrounds = Ext.create('Ext.data.Store', {
    model: 'Background',
    data: [
		{'backgroundlayer': 'Geländemodell'},
		{'backgroundlayer': 'Luftbild'},
		{'backgroundlayer': 'kein Hintergrund'}
	]
});

var resultTpl = new Ext.XTemplate(
    '<tpl for="."><div class="bgselector">',
    '{backgroundlayer}',
    '</div></tpl>'
);

Ext.define('GbZh.widgets.BackgroundSelector', {
	extend: 'Ext.form.field.ComboBox',
	alias: 'widget.gb-backgroundselector',
    fieldLabel: '',
	store: backgrounds,
	displayField: 'backgroundlayer',
    width: 120,
    queryMode: 'local',
	value: 'Geländemodell',
	forceSelection: true,
	id: 'bgselector',
/*
	getInnerTpl: function () {
        return '<div data-qtip="{backgroundlayer}">{backgroundlayer}</div>';
    },
 */
/*     tpl: resultTpl,
    itemSelector: 'div.bgselector',
 */
//   typeAhead: true,
	listeners: {
		select: function (field, e) {
			this.setValue(this.getValue());
			var layers =  GbZh.base.ViewerState.map.getLayersByClass('OpenLayers.Layer.WMS'),
				i,
				len;
			if (this.getValue() === 'kein Hintergrund') {
				GbZh.base.ViewerState.map.baseLayer.setVisibility(false);
			} else {
				for (i = 0, len = layers.length; i < len; i++) {
					//LOG console.log(i + " " + layers[i].name + " " + layers[i].isBaseLayer);
					if (layers[i].isBaseLayer && layers[i].name === this.getValue()) {
						GbZh.base.ViewerState.map.setBaseLayer(layers[i]);
					}
				}
			}
		}
	}
});

//TODO funktioniert nicht
var tip = Ext.create('Ext.tip.ToolTip', {
    target: Ext.get('bgselector'),
    html: '<b>Kartenhintergrund</b> auswählen'
});
//Funktioniert nicht...
//Ext.ToolTip.register({ target:  Ext.get('opacityslider'), text: 'yourtext' });
/* var tip = Ext.create('Ext.tip.ToolTip', {
    target: Ext.get('opacityslider'),
    html: 'Press this button to clear the form'
}); */