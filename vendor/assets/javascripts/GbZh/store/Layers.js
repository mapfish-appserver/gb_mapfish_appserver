Ext.define('GbZh.store.Layers', {
	extend: 'Ext.data.Store',
	model: 'gb-layer',

	constructor: function (config) {
		this.initConfig(config);
		return this;
	}
});

/* //GbZh.store.Layers = Ext.extend(Ext.data.Store, {
    constructor: function (config) {
        var conf = config || {};
        
        conf.model = conf.model || 'gb-layer';
        
        conf.proxy = conf.proxy || {
            type: 'memory',
            reader: Ext.create('GbZh.store.LayerReader', ({}))
        };
                
// !!!       return GbZh.model.LayerStore.superclass.constructor.call(this, conf);
//       this.callParent();
    }
 */
