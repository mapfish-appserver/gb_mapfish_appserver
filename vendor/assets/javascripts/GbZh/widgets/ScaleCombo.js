Ext.define('Massstab', {
	extend: 'Ext.data.Model',
    fields: [
        {type: 'string', name: 'scale'}
    ]
});

var massstaebe = [
	{"scale": "500000"},
	{"scale": "200000"},
	{"scale": "100000"},
	{"scale": "50000"},
	{"scale": "20000"},
	{"scale": "10000"},
	{"scale": "5000"},
	{"scale": "2000"},
	{"scale": "1000"},
	{"scale": "500"}
];

// The data store holding the states
var scaleStore = Ext.create('Ext.data.Store', {
    model: 'Massstab',
    data: massstaebe
});


Ext.define('GbZh.widgets.ScaleCombo', {
	extend: 'Ext.form.field.ComboBox',
	//	requires: 'GbZh.widgets.MapPanel',
	alias: 'widget.gb-scalecombo',
	fieldLabel: 'Massstab, 1',
	map: {},
	maxScale: 99999999,
	minScale: 1,
	//	width: 550,
	// labelWidth: 130,
	valueField: 'scale',
	displayField: 'scale',
	decimalPrecision: 0,
	//		baseCls: 'gb-scalecombo',
	store: scaleStore,
	queryMode: 'local',
	//enableKeyEvents: true,
	//		typeAhead: true

	listeners: {
		select: function (field, e) {
			this.setValue(this.getValue());
			this.setScale();
		},
		keypress: function (field, e) {
			//LOG console.log(this);
		},
		specialkey: function (field, e) {
			// e.HOME, e.END, e.PAGE_UP, e.PAGE_DOWN,
			// e.TAB, e.ESC, arrow keys: e.LEFT, e.RIGHT, e.UP, e.DOWN
			if (e.getKey() === e.ENTER) {
				this.setScale();
			}
		},
		spindown: function (field, e) {
			this.setValue(1.5 * this.getValue());
			this.setScale();
		},
		spinup: function (field, e) {
			this.setValue(this.getValue() / 1.5);
			this.setScale();
		}
	},

	initComponent: function () {
		Ext.applyIf(this, this.config);
		this.callParent();

		if (this.map) {
			if (this.map instanceof GbZh.widgets.MapComponent) {
				this.map = this.map.map;
			}
			this.bind(this.map);
		}
		// this.maxValue = this.maxScale;
		// this.minValue = this.minScale;
		this.scaleFactor = Math.pow(10, this.decimalPrecision);
		//this.maxLength = 10;
		//this.autoCreate = { maxlength: '12' }
		this.selectOnFocus = true;
		//this.addClass(this.baseCls);
		this.enableKeyEvents = true;
		//this.on("keypress", this.setScaleHandler, this);
		this.on("beforedestroy", this.unbind, this);
	},

	bind: function (map) {
		this.map = map;
		this.map.events.on({
			zoomend: this.update,
			addlayer: this.update,
			scope: this
		});
		if (this.map.baseLayer) {
			this.update();
		}
	},

	unbind: function () {
		this.map = null;
	},


/*     onRender: function () {
        GbZh.widgets.ScaleTextField.superclass.onRender.apply(this, arguments);
        //this.el.addClass(this.baseCls);
    },
 */
/** private: method[setScaleHandler]
*  Set scale.

    setScaleHandler: function (t, e) {
        if (e.getKey() === 13) {
            alert(t.getValue());
            this.map.zoomToScale(t.getValue(), false);//zoomToScale: function(scale {float},	closest{Boolean})
        }
    },
*/

	setScale: function () {
		//           alert(this.getValue());
		//LOG console.log(this.getValue());
		this.setValue(Math.round(this.getValue()));
		this.map.zoomToScale(this.getValue(), false);
	},

	/** private: method[update]
	 *  Registered as a listener for map zoomend.  Updates the value of the scaleTextField.
	 */
	update: function () {
		if (this.rendered && this.map) {
			this.setValue("" + Math.round(this.scaleFactor * this.map.getScale() / this.scaleFactor));
		}
	}

});