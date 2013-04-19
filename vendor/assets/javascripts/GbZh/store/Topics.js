Ext.define('GbZh.store.Topics', {
	extend: 'Ext.data.Store',
	requires: ['GbZh.model.Topic', 'GbZh.base.ViewerState'],
	model: 'GbZh.model.Topic',
	singleton: true,
	autoLoad: false,
/* 
//TODO: sind diese groupers und sorters tatsächlich überflüssig?	
	groupers: [{
		property: 'topicgrouptheme',
		direction: 'ASC'
	}, {
		property: 'topicgrouporanisation',
		direction: 'ASC'
	}],
	sorters: [{
		property: 'topictitle',
		direction: 'DESC'
	}, {
		property: 'topicname',
		direction: 'ASC'
	}],

 */
	config: {
		url: '../../topics.json'
	},

	constructor: function () {
		this.callParent(arguments);
		GbZh.base.ViewerState.on('dotopicstoreload', this.load, this);
//		GbZh.base.ViewerState.on('userchanged', this.loadTopics, this);
		GbZh.base.ViewerState.on('userchanged', this.load, this);
		this.on('load', this.selectTopic, this);
	},

	loadTopics: function () {
		this.setProxy({
			type: this.model.proxy.type,
			url: this.config.url,
			reader: this.model.proxy.reader
		});
		this.load();
	},

	selectTopic: function () {
		var topic = {
			name: GbZh.base.ViewerState.activeTopic,
			title: GbZh.base.ViewerState.activeTopicTitle,
			overlay: false
		};
		var index = this.findExact('name', topic.name);
//HACK
		if (index < 0) {
			topic.name = 'BASISKARTEZH';
			topic.title = 'Basiskarten (Landeskarten, Übersichtspläne)'
		    index = this.findExact('name', topic.name);
		}
		if (index < 0) {
			Ext.MessageBox.show({
				title: 'Topic ' + topic.title + ' requested.',
				msg: 'Theme "' + topic.name + '" not loaded (not found).',
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
			//			Ext.Msg.alert('"' + topic.name + '" not found. <br>Server probably down.');
		} else {
			GbZh.base.ViewerState.currentTopicRecord = this.getAt(index);
		}
		//		topic.title = this.getAt(index).topictitle;
		//		topic.title = 'titel';
		GbZh.base.ViewerState.fireEvent('topicselected', topic);
		//LOG console.log("***** " + topic.title);
	},

	getMetaForTopic: function (topic) {
		var index = this.findExact('name', topic.name);
		if (index >= 0) {
			return this.getAt(index).get('geoliongdd');
		}
	},

	//Informationen für Karten-Konfiguration
	wmsConfig: function (topic) {
		var index = this.findExact('name', topic.name);
		if (index !== -1) {
			var r = this.getAt(index);
			return {
				topic: topic.name,
				layername: r.data.title,
				wms_url: r.data.wms_url,
				layer_params: r.data.wms_layer_params,
				layer_options: r.data.wms_layer_options
			};
		}
		return null;
	},

	myLoadData: function () {
		return [{
			"main_layer": true,
			"topictitle": "AeroDat",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/AeroDat",
			"topicsortoranisation": null,
			"topicgrouporanisation": "Amt für Raumentwicklung",
			"base_layer": null,
			"topicgrouptheme": "Raumplanung",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "AeroDat",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "AeroDat",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-aerodat.gif"
		}, {
			"main_layer": true,
			"topictitle": "Hochbauten, Jauchegruben",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/GB-ALA2",
			"topicsortoranisation": null,
			"topicgrouporanisation": "ALN",
			"base_layer": null,
			"topicgrouptheme": "Landwirtschaft",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "GB-ALA2",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Hochbauten, Jauchegruben",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-gb-ala2.gif"
		}, {
			"main_layer": true,
			"topictitle": "Klimaeignungskarte",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/Ala3",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Landwirtschaft",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "Ala3",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Klimaeignungskarte",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-ala3.gif"
		}, {
			"main_layer": true,
			"topictitle": "Hanglagen, Landwirtschaftliche Zonengrenzen, Liegenschaften und Bodenbedeckung",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/JPG"
			},
			"wms_url": "http://web.wms.zh.ch/Ala4",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Landwirtschaft",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "Ala4",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Hanglagen, Landwirtschaftliche Zonengrenzen, Liegenschaften und Bodenbedeckung",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-ala4.gif"
		}, {
			"main_layer": true,
			"topictitle": "&Uuml;berbauungsstand 2008",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/GB-ARPStand",
			"topicsortoranisation": null,
			"topicgrouporanisation": "Amt für Raumentwicklung",
			"base_layer": null,
			"topicgrouptheme": "Raumplanung",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "GB-ARPStand",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "&Uuml;berbauungsstand 2008",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-gb-arpstand.gif"
		}, {
			"main_layer": true,
			"topictitle": "Nutzungszonen Stand 2008",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/GB-ARPZonen",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Raumplanung",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "GB-ARPZonen",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Nutzungszonen Stand 2008",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-gb-arpzonen.gif"
		}, {
			"main_layer": true,
			"topictitle": "Kantonaler Richtplan - Karte Siedlung und Landschaft",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/RiSla",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Raumplanung",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "RiSla",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Kantonaler Richtplan - Karte Siedlung und Landschaft",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-risla.gif"
		}, {
			"main_layer": true,
			"topictitle": "Kantonaler Richtplan - Karte Verkehr",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/RiVkrRev",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Raumplanung",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "RiVkrRev",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Kantonaler Richtplan - Karte Verkehr",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-rivkrrev.gif"
		}, {
			"main_layer": true,
			"topictitle": "Baustellen",
			"hassubtopics": false,
			"missingpermission": false,
			"wms_layer_params": {
				"format": "image/png"
			},
			"wms_url": "http://web.wms.zh.ch/TBABaustellen",
			"topicsortoranisation": null,
			"topicgrouporanisation": null,
			"base_layer": null,
			"topicgrouptheme": "Verkehr",
			"overlay_layer": null,
			"subtopics": [],
			"topicname": "TBABaustellen",
			"wms_layer_options": {
				"singleTile": true,
				"ratio": 1
			},
			"topictext": "Baustellen",
			"topicsorttheme": null,
			"topicicon": "../../images/custom/themekl-rivkrrev.gif"
		}];
	}

});