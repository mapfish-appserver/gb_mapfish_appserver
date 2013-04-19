Ext.define('GbZh.widgets.TopicGrid', {
	extend: 'Ext.grid.Panel',
	alias: 'widget.gb-topicgrid',
	requires: ['GbZh.store.Topics', 'GbZh.model.Topic', 'GbZh.base.ViewerState'],
	selType: 'rowmodel',
	selModel: {
		mode: 'SINGLE',
		listeners: {
			select: {
				fn: function (sm, selected, options) {
					if (selected.data.hassubtopics) {
						return;
					} else {
						GbZh.base.ViewerState.fireEvent('topicselected', {
							name: selected.data.name,
							title: selected.data.title,
							overlay: false
						});
					}
				}
			}
		}
	},

	viewConfig: {
		getRowClass: function (record, rowIndex, rowParams, store) {
//TODO Entscheid aufgrund von einer Variablen
//			return record.data.name.substring(0, 1) === 'A' ? "specialtheme" : "";
		}
	},

	hideHeaders: true,
	autoExpandColumn: 'title-col',

	initComponent: function () {
		this.store = GbZh.store.Topics;
		//GbZh.base.ViewerState.addListener({stateset: {fn: this.onTopicGroupingChange}});
		this.columns = this.buildColumns();
		this.tools = this.buildTools();
		this.features = this.buildFeatures();

		this.callParent(arguments);

		GbZh.base.ViewerState.on('stateset', this.onTopicGroupCategory, this);
		GbZh.base.ViewerState.on('collapseall', this.onCollapseAll, this);
		GbZh.base.ViewerState.on('expandall', this.onExpandAll, this);
		GbZh.base.ViewerState.on('topicgroupcategory', this.onTopicGroupCategory, this);
		GbZh.base.ViewerState.on('topicgrouporganisation', this.onTopicGroupOrganisation, this);
		GbZh.base.ViewerState.on('topicgroupalphabet', this.onTopicAlphabet, this);
//		GbZh.base.ViewerState.on('selectionchange', this.onSelectionChange, this);
		this.onTopicGroupCategory();
	},

	buildColumns: function () {
		return [{
			header: 'name',
			width: 30,
			dataIndex: 'name',
			hidden: true
		}, {
			header: 'TopicGroup',
			width: 30,
			dataIndex: 'categorytitle',
			groupName: 'category',
			hidden: true
		}, {
			header: '&#160;',
			width: 51,
			dataIndex: 'icon',
			sortable: false,
			renderer: function (val, x, store) {
				return '<img src="' + val + '" alt="' + store.data.title + '" title="' + store.data.title + '" width=51>';
			}
		}, {
			header: 'Titel',
			dataIndex: 'title',
			sortable: true,
			flex: 1,
			id: 'title-col',
			renderer: function (value, metaData, record, colIndex, rowIndex, store) {
				//XXX Parameter sind korrekt, stimmen aber nicht mit der Doku überein
				metaData.style = 'white-space:normal !important;';
				var strTopic = '';
				if (record.data.name.substring(0, 1) === 'A') {
					metaData.style = 'white-space:normal !important;';
//					strTopic += '<div style="background-color:#ffaaaa">';
				}
				if (record.data.hassubtopics) {
					var selObj = {
						name: record.data.name,
						title: value.toString(),
						overlay: false
					};
					var strSubTopics = [];
					var i, len;
					strTopic += "<a href='#' onclick='GbZh.base.ViewerState.fireEvent(\"topicselected\", "
						+ Ext.encode(selObj) + ")'>" + value.toString() + '</a>,<br />';
					for (i = 0, len = record.data.subtopics.length; i < len; i += 1) {
						selObj = {
							name: record.data.subtopics[i].subtopicname,
							title: value.toString(),
							overlay: false
						};
						strSubTopics.push("<a href='#' onclick='GbZh.base.ViewerState.fireEvent(\"topicselected\", "
							+ Ext.encode(selObj) + ")'>" + record.data.subtopics[i].subtopictitle + '</a>');
					}
					strTopic += strSubTopics.join(', ');
				} else {
					strTopic += value.toString();
				}
				return strTopic;
			}
		}];
	},


	buildTools: function () {
		return [{
			xtype: 'textfield',
			name: 'filter',
			width: 90,
			emptyText: 'Filter ...',
			enableKeyEvents: true,
			style: {
				marginBottom: '0px',
				marginTop: '0px'
			},

			listeners: {
				keyup: function (f, k) {
					var fil = this.value;
					this.ownerCt.ownerCt.store.clearFilter();
					this.ownerCt.ownerCt.store.filter("title", new RegExp(fil, 'i'));
				}
			}
		}, {
			text: 'Gruppierung',
			//            iconCls: 'bmenu',  // <-- icon
			xtype: 'splitbutton',
			menu: {
				items: [{
					text: 'nach Themen',
					group: 'sorting',
					checked: true,
					handler: function (item) {
						GbZh.base.ViewerState.fireEvent('topicgroupcategory');
					}
				}, {
					text: 'nach Fachstellen',
					group: 'sorting',
					checked: false,
					handler: function (item) {
						GbZh.base.ViewerState.fireEvent('topicgrouporganisation');
					}
				}, {
					text: 'nur alphabetisch',
					group: 'sorting',
					checked: false,
					handler: function (item) {
						GbZh.base.ViewerState.fireEvent('topicgroupalphabet');
					}
				}]
			}
		}, {
			qtip: 'Alles Einklappen',
			type: 'minus',
			handler: function (event, toolEl, panel) {
				GbZh.base.ViewerState.fireEvent('collapseall');
			}
		}, {
			qtip: 'Alles Ausklappen',
			type: 'plus',
			handler: function (event, toolEl, panel) {
				GbZh.base.ViewerState.fireEvent('expandall');
			}
		}

			];
	},

	buildFeatures: function () {
/*		return [Ext.create('Ext.grid.feature.Grouping', {
			groupHeaderTpl: '{[
				//LOG console.log(values)
				]}'
		})]; */
		return [Ext.create('Ext.grid.feature.Grouping', {
			groupHeaderTpl: '{name} ({rows.length} Karte{[values.rows.length > 1 ? "n" : ""]})'
		})];
	},


	onTopicAlphabet: function () {
		//FIXME: hier wäre die Verwendung einer dummy-Variablen nötig. singleTile als Test		
		this.store.group('singleTile', 'ASC');
		this.store.sort([{
			property: 'singleTile',
			direction: 'ASC'
		}, {
			property: 'title',
			direction: 'ASC'
		}]);
	},

	onTopicGroupCategory: function () {
//		this.store.group('topicgroupcategory', 'ASC');
		this.store.group([{
			property: 'categorytitle',
			direction: 'ASC'
		}, {
			property: 'title',
			direction: 'ASC'
		}]);
		this.store.sort([{
			property: 'categorysort',
			direction: 'ASC'
		}, {
			property: 'title',
			direction: 'ASC'
		}]);
	},

	onTopicGroupOrganisation: function () {
		this.store.group('organisationtitle', 'ASC');
		this.store.sort([{
			property: 'organisationsort',
			direction: 'DESC'
		}, {
			property: 'title',
			direction: 'ASC'
		}]);
	},

	onCollapseAll: function () {
		var i;
		var view = this.view;
		var theHeaders = view.el.query('.x-grid-group-hd');
		for (i = 0; i < theHeaders.length; i += 1) {
			var group_body = Ext.fly(theHeaders[i].nextSibling, '_grouping');
			view.features[0].collapse(group_body);
		}
	},

	onExpandAll: function () {
		var view = this.view;
		view.el.query('.x-grid-group-hd').forEach(function (group) {
			var group_body = Ext.fly(group.nextSibling, '_grouping');
			view.features[0].expand(group_body);
		});
	},

	onTopicGroupingChange: function (was, sortierung) {
		//LOG console.log('FiRE im topicpanel! ' + this.title);
		this.store.group(was, sortierung);
		//		me.store.group('topicgrouporanisation', 'ASC');
	},

	onSelectionChange: function (selModel, selected, options) {
		//LOG console.log('FIRE im topicpanel! ' + selected.data.name);
		//		this.store.group(was, sortierung);
		//		me.store.group('topicgrouporanisation', 'ASC');
	}


});