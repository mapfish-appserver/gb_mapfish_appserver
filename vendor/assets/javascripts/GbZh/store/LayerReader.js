/**
 * Copyright (c) 2008-2011 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = GeoExt
 *  class = Acsfsftion
 *  base_link = `Ext.Action <http://dev.sencha.com/deploy/dev/docs/?class=Ext.Action>`_
 */

/** api: example
 *  Sample code to create a toolbar with an OpenLayers control into it.
 * 
 *  .. code-block:: javascript
 *  
 *      var action = new GeoExt.Actsfdsfion({
 *          text: "max extent",
 *          control: new OpenLayers.Control.ZoomToMaxExtent(),
 *          map: map
 *      });
 *      var toolbar = new Ext.Toolbar([action]);
 */

/** api: constructor
 *  .. class:: Actsffion(config)
 *  
 *      Create a GeoExt.Action instance. A GeoExt.Action is created
 *      to insert an OpenLayers control in a toolbar as a button or
 *      in a menu as a menu item. A GeoExt.Action instance can be
 *      used like a regular Ext.Action, look at the Ext.Action API
 *      doc for more detail.
 */

Ext.define('GbZh.store.LayerReader', {
	extend: 'Ext.data.JsonReader',
	alias: 'widget.gb-layerreader',
    root: '',
    readRecords: function (layers) {
//CHECK: braucht es das superclass-Konstrukt???
        var recs = GbZh.store.LayerReader.superclass.readRecords.call(this, layers);

        //TODO: Discuss whether we can copy and adjust the contents of GXM.data.LayerReader.superclass.readRecords so we do not need to iterate twice over the records
        Ext.each(recs.records, function (record, index) {
            if (Ext.isDefined(record.data) && Ext.isDefined(record.data.layer)) {
                record.data.layer = record.raw;
            }
        });

        return recs;
    }

});

