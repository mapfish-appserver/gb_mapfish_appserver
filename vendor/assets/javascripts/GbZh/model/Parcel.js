var umlRe = /&([AEIOUYaeiouy])UML;/g,
	szRe = /&szlig;/g,
	aeoeue = /([ÄÖÜ])/g;

function germanize(s) {
	return s.replace(umlRe, function (a, b) {
		return b;
	}).replace(/Ö/g, 'O').replace(/Ä/g, 'A').replace(/Ü/g, 'U');
}

Ext.apply(Ext.data.SortTypes, {
	asUCText: function (s) {
		return germanize(String(s).toUpperCase().replace(this.stripTagsRE, ""), false);
	},
	asUCString: function (s) {
		return germanize(String(s).toUpperCase(), false);
	},
	asText: function (s) {
		return germanize(String(s).replace(this.stripTagsRE, ""), true);
	},
	none: function (s) {
		return germanize(s, true);
	}
});

Ext.define('GbZh.model.Parcel', {
	extend: 'Ext.data.Model',

	fields: [
		{
			name: 'lkx',
			type: 'string'
		},
		{
			name: 'lky',
			type: 'string'
		},
		{
			name: 'geodb_oid',
			type: 'string'
		},
		{
			name: 'bsname',
			type: 'string'
		},
		{
			name: 'gemeinde',
			type: 'string',
			sortType: 'asUCText'
		}

	],

	proxy: {
		type: 'ajax',
		url: '../../search/parzelle.json',
		reader: {
			type: 'json',
			root: 'features'
		}
	}
});