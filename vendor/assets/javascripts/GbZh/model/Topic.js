var umlRe = /&([AEIOUYaeiouy])UML;/g, szRe = /&szlig;/g, aeoeue = /([ÄÖÜ])/g;
function germanize(s) {
	return s.replace(umlRe,
		function (a, b) {return b; }).replace(/Ö/g, 'O').replace(/Ä/g, 'A').replace(/Ü/g, 'U');
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

Ext.define('GbZh.model.Topic', {
	extend: 'Ext.data.Model',

	fields: [
		'name',
		{ name: 'title', type: 'string', sortType: 'asUCText' },
		'description',
		'icon',
		{ name: 'organisationtitle', type: 'string', sortType: 'asUCText' },
		'organisationsort',
		{ name: 'categorytitle', type: 'string', sortType: 'asUCText' },
		'categorysort',
		'geoliongdd',
		{ name: 'hassubtopics', type: 'bool' },
		'subtopics',
		{ name: 'missingpermission', type: 'bool' },
		'wms_url',
		'wms_layer_params',
		'wms_layer_options',
		{ name: 'base_layer', type: 'bool' },
		{ name: 'main_layer', type: 'bool' },
		{ name: 'overlay_layer', type: 'bool' },
		'tools'
	],

	proxy: {
		type: 'ajax',
		url: '../../topics.json',
		extraParams: {'gbapp':'default'},
//      url : '../../topics.txt',
//		url : 'http://localhost:3000/lib/GbZh/Gb/data/topics.json',
//		callbackKey: 'ccbbcc',
//		callbackPrefix: 'aabbcc',
        reader: {
            type: 'json',
            root: 'gbtopics'
        }
    }
});