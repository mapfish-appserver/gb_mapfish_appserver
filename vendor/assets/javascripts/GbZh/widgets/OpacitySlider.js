Ext.define('GbZh.widgets.OpacitySlider', {
	extend: 'Ext.slider.Single',
	alias: 'widget.gb-opacityslider',
    requires: [
		'GbZh.base.ViewerState'
	],
	id: 'opacityslider',
	width: 80,
	minValue: 0,
	hideLabel: true,
	useTips: true,
	tipText: function () {
		return '<b>Transparenz</b> der thematischen<br>Kartenebene einstellen';
	},
	maxValue: 100,
	listeners: {
		drag: function () {
			var opacity = (100.0 - this.getValue()) / 100.0,
				layers =  GbZh.base.ViewerState.map.getLayersByClass('OpenLayers.Layer.WMS'),
				i,
				len;
			for (i = 0, len = layers.length; i < len; i++) {
				if (!layers[i].isBaseLayer) {
					layers[i].setOpacity(opacity);
				}
			}
		}
	}

});