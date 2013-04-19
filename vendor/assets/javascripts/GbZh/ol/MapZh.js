/* Map with scaleUpdate Event */
OpenLayers.MapZh = OpenLayers.Class(OpenLayers.Map, {

    initialize: function (options) {
        OpenLayers.Map.prototype.initialize.apply(this, [options]);
        this.events.addEventType("scaleUpdate")
    },

    moveTo: function(lonlat, zoom, options) {
        //LOG console.log("OpenLayers.MapZh moveTo - zoom: " + zoom);
        if (zoom != null) {
            var newZoom = parseFloat(zoom);
            if (!this.fractionalZoom) {
                newZoom = Math.round(newzoom);
            }
            var resolution = this.getResolutionForZoom(newZoom);
            var units = this.baseLayer.units;
            var scale = OpenLayers.Util.getScaleFromResolution(resolution, units);
            this.events.triggerEvent("scaleUpdate", scale);
        }
        return OpenLayers.Map.prototype.moveTo.apply(
            this, arguments);
    },

    CLASS_NAME: "OpenLayers.MapZh"
});
