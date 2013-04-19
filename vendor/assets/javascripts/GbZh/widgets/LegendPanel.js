Ext.define('GbZh.widgets.LegendPanel', {
    extend: 'Ext.panel.Panel',
	requires: [
		'GbZh.base.ViewerState',
		'GbZh.store.GeoLionDatasets',
		'GbZh.model.GeoLionDataset'
	],
	alias: 'widget.gb-legendpanel',
    id: 'legendpanel',
	title: 'Legende',
	metadatastore: null,
	metaDataTemplate: null,

	initComponent: function () {
		this.metadatastore = Ext.create('GbZh.store.GeoLionDatasets');
		this.metadatastore.on('load', this.fillMeta, this);
		GbZh.base.ViewerState.on('wmslayerstoreloaded',  this.showLegendInfo, this, this);
        GbZh.base.ViewerState.on('printLegend',  this.printLegend, this, this);
//		GbZh.base.ViewerState.on('showmetadata', this.doShowMetadata, this, this);
		GbZh.base.ViewerState.on('insertmetadata', this.doInsertMetadata, this, this);
		this.callParent(arguments);
		this.metaDataTemplate = new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="metadata">',
			'<h1>{title}</h1>',
			'<span>{owner}</span><br/>',
			'<span><i>Stand: {standdate}</i></span><br/>',
			'<span>Nachführung: {nachfuehrungstyp}</span><br/><br/>',
			'<span><b>{kurzbeschreibung}</b></span><br/><br/>',
			'<span>{beschreibung}</span><br/>',
			'</div>',
			'<a href="javascript:;" onmousedown="toggleSlide(\'meta' + this.metadatastore.proxy.extraParams.nr + '\');">',
			'<img src="/img/triangle_up.gif" height="10" width="10" align="right"></a>',
			'</tpl>'
		);

	},

	printLegend: function () {
		var w = window.open("", "legend_print", "resizable=yes,status=no,location=no,width=550,height=800,left=100");
		var d = w.document;
		d.writeln('<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
		d.writeln('<title>GIS-Browser Legende</title>');
		d.writeln('<link rel="stylesheet" type="text/css" href="../../lib/ext/ext4/resources/css/ext-all.css">');
		d.writeln('<link rel="stylesheet" type="text/css" href="resources/css/my-ext-theme.css">');
		d.writeln('<link rel="stylesheet" type="text/css" href="../../lib/GbZh/css/gbzh.css">');
		d.writeln('</head>');
		d.writeln('<body onload="window.print()">');
		d.write('<div class="x-body">');
		d.writeln('<h1>' + Ext.get('myHeader').dom.textContent + '</h1>');
		d.writeln('<div class="legtext"> Legende</div><br/>');
		d.write(Ext.getCmp("legend").html);
		d.writeln('</div>');
		d.writeln('</body></html>');
		d.close();
	},

	doInsertMetadata: function (nr) {
		this.metadatastore.proxy.extraParams.nr = nr;
		this.metadatastore.load();
	},

	fillMeta: function (store, records, successful, operation,  eOpts) {
//Ext.data.Store this, Ext.util.Grouper[] records, Boolean successful, Ext.data.Operation operation, Object eOpts
		var divtag = "meta" + store.proxy.extraParams.nr;
		this.metaDataTemplate.overwrite(Ext.get(divtag), records[0].data);
//		slidedown(divtag);
		toggleSlide(divtag);
	},

	showLegendInfo: function (topic, me) {
		if (!topic.overlay) {
			Ext.Ajax.request({
				url: '/topics/' + topic.name + '/legend',
				success: function (response, opts) {
					var legHtml = '<div id="legtxt">';
/*
//INFO: hätten wir Metadaten auf Topic-Niveau, müsste man da was machen
					var gdpnr = GbZh.store.Topics.getMetaForTopic(topic);
					if (gdpnr) {
						legHtml += '<a href="#" onclick="GbZh.base.ViewerState.fireEvent(\'showmetadata\', \'P\', \'' + gdpnr + '\', \'0\')">';
						legHtml += '<img src="/img/info.png" alt="Metadaten"></a>';
					}
						
 */
					legHtml += '<span class="noPrint"><a href="#" onclick="GbZh.base.ViewerState.fireEvent(\'printLegend\')">';
					legHtml += '<img src="/img/print.png" alt="Metadaten"></a></span>';
					legHtml += response.responseText;
					legHtml += '</div>';
					me.update(legHtml);
					me.expand();
				}
			});
		}
	}

});
