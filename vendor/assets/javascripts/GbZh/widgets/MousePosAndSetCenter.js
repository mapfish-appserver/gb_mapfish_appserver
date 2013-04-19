/**
 *
 */
Ext.define('GbZh.widgets.MousePosAndSetCenter', {
	extend: 'Ext.form.TextField',
	requires: ['GbZh.widgets.MapComponent'],
	alias: 'widget.gb-mouseposandsetcenter',
	config: {
		map: {},
		maxScale: 99999999,
		minScale: 1,
		decimalPrecision: 0,
		baseCls: "gb-mouseposandsetcenter",
		emptyString: '',
		prefixEast: '',
		prefixNorth: '',
		separator: ' / ',
		suffix: '',
		numDigits: 0,
		granularity: 10,
		/** 
		 * @property {OpenLayers.Pixel} lastXy Last position on map
		 */
		lastXy: null
	},

	listeners: {
		focus: function (field, e) {
			//			this.empty();
		},

		blur: function (field, e) {
			this.reset();
		},

		specialkey: function (field, e) {
			// e.HOME, e.END, e.PAGE_UP, e.PAGE_DOWN,
			// e.TAB, e.ESC, arrow keys: e.LEFT, e.RIGHT, e.UP, e.DOWN
			var centerCoord;
			if (e.getKey() === e.ENTER) {
				centerCoord = this.parseCoord(this.getValue());
				this.map.setCenter(centerCoord);
				////LOG console.log(centerCoord);
			}
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
		if (!this.cls) {
			this.cls = this.baseCls;
		}
		this.selectOnFocus = true;
		this.enableKeyEvents = true;
		//        this.on("keypress", this.setCenterHandler, this);
		this.on("beforedestroy", this.unbind, this);
	},

	bind: function (map) {
		this.map = map;
		this.map.events.on({
			mousemove: this.update,
			mouseout: this.reset,
			scope: this
		});
		if (this.map.baseLayer) {
			this.update();
		}
	},

	unbind: function () {
		this.map.events.un('mousemove', this, this.update);
		this.map.events.un('mouseout', this, this.reset);
		this.map = null;
	},

/*     setCenterHandler: function (t, e) {
        var centerCoord;
        if (e.getKey() === 13) {
            //alert(t.getValue());
            centerCoord = this.parseCoord(t.getValue());
            this.map.setCenter(centerCoord); //zoomToScale: function(scale {float},	closest{Boolean})
        }
    },
 */
	/** private: method[parseCoord]
	 *  Parse the coordString and convert to valid OpenLayers.LonLat-Object. Returns null if not valid.
	 *  EPSG:21781
	 *  - 685'853.20 - 253'126.60
	 *  - 685853.20/253126.60
	 *  EPSG:4326
	 *  - N47.12345° E007.98765°
	 *  - N47° 12.345' E 007° 98.765'
	 *  - N47° 12' 345.67" E 007° 98' 765"
	 */
	parseCoord: function (coordString) {
		var validCoords = false;
		var eastCoord, northCoord;
		var strTemp = '';
		var strCoord1 = '';
		var strCoord2 = '';
		var stringCoords;
		var projectionString = this.map.getProjection();
		var i;

		coordString = coordString.trim();

		var Ausdruck = /\d+/; //beliebige Ganzzahl
		strTemp = Ausdruck.exec(coordString);
		if (strTemp[0] > 180) { //Landeskoordinaten
			coordString = coordString.replace(/\´+|\`+|\'+/g, ""); // Tausender-Trennzeichen ersetzen 685´853.20 -> 685853.20
			coordString = coordString.replace(/\./g, "p"); // Dezimalpunkt ersetzen 685853.20 - 253126.60 -> 685853x20 - 253126x60
			coordString = coordString.replace(/\W+/g, "$"); // -> 685853x20$253126x60
			coordString = coordString.replace(/p/g, "."); // Dezimalpunkt ersetzen -> 685853.20$253126.60
			stringCoords = coordString.split("$");
			for (i = 0; i < stringCoords.length; i += 1) {
				strTemp = stringCoords[i];
				if (strTemp > 100000) {
					if (strCoord1 === '') {
						strCoord1 = strTemp;
					} else {
						strCoord2 = strTemp;
					}
				}
			}
			if (strCoord1 > 100000 && strCoord2 > 100000) {
				if (strCoord1 > strCoord2) {
					eastCoord = strCoord1;
					northCoord = strCoord2;
				} else {
					eastCoord = strCoord2;
					northCoord = strCoord1;
				}
				validCoords = true;
			}
		} else { // WGS84
			coordString = coordString.replace(/\./g, "p"); // Dezimalpunkt ersetzen N 47.20423 - E 8.253126 -> N 47p20423 - E 8p253126
			//coordString = coordString.replace(/\°/g, "g"); // Grad
			//coordString = coordString.replace(/\'/g, "m"); // Minuten
			//coordString = coordString.replace(/\"/g, "s"); // Sekunden
			coordString = coordString.replace(/\W+/g, "$"); // 
			coordString = coordString.replace(/p/g, "."); // Dezimalpunkt ersetzen -> N 47p20423 - E 8p253126$N 47.20423 - E 8.253126
			stringCoords = coordString.split("$");
			if (stringCoords.length === 2) { //
				strCoord1 = stringCoords[0];
				strCoord2 = stringCoords[1];
			} else {
				for (i = 0; i < stringCoords.length; i += 1) {
					strTemp = stringCoords[i];
					eastCoord = stringCoords[0];
					northCoord = stringCoords[1];
				}
			}


			if (strCoord1 >= -180 && strCoord1 <= 180 && strCoord2 >= -90 && strCoord2 <= 90) {
				eastCoord = strCoord1;
				northCoord = strCoord2;
				validCoords = true;
			} else if (strCoord2 >= -180 && strCoord2 <= 180 && strCoord1 >= -90 && strCoord1 <= 90) {
				eastCoord = strCoord2;
				northCoord = strCoord1;
				validCoords = true;
			}
		}

		if (projectionString === "EPSG:21781") {

		} else if (projectionString === "EPSG:4326") {

		}


		if (validCoords) {
			return new OpenLayers.LonLat(eastCoord, northCoord);
		} else {
			return null;
		}
	},


	update: function (evt) {
		var lonLat;
		if (evt === undefined || evt === null) {
			this.reset();
			return;
		} else {
			if (this.lastXy === null || Math.abs(evt.xy.x - this.lastXy.x) > this.granularity || Math.abs(evt.xy.y - this.lastXy.y) > this.granularity) {
				this.lastXy = evt.xy;
				return;
			}

			lonLat = this.map.getLonLatFromPixel(evt.xy);
			if (!lonLat) {
				// map has not yet been properly initialized
				return;
			}
			if (this.displayProjection) {
				lonLat.transform(this.map.getProjectionObject(), this.displayProjection);
			}
			this.lastXy = evt.xy;

		}

		var newHtml = this.formatOutput(lonLat);

		if (newHtml !== this.getValue) {
			this.setValue(newHtml);
		}
	},

	reset: function (evt) {
		if (this.emptyString !== null) {
			//           this.setValue(this.map.getCenter().lon + this.separator + this.map.getCenter().lat);
		}
	},

	empty: function (evt) {
		this.setValue("");
	},

//TODO das folgende statement war erstaunlicherweise ausserhalb der funktion ...
//	var digits = parseInt(this.numDigits, 10);
	formatOutput: function (lonLat) {
		var digits = parseInt(this.numDigits, 10);
		var newHtml = this.prefixEast + lonLat.lon.toFixed(digits) + this.separator + this.prefixNorth + lonLat.lat.toFixed(digits) + this.suffix;
		return newHtml;
	},

	//    /**
	//    * Method: destroy
	//    */
	//    destroy: function () {
	//        if (this.map) {
	//            this.map.events.unregister('mousemove', this, this.redraw);
	//        }
	//        OpenLayers.Control.prototype.destroy.apply(this, arguments);
	//    },
	CLASS_NAME: "GbZh.MousePosAndSetCenter"
});

function WGS2CH(B, L, H) {

/* JavaScript zum Umrechnen von Schweizer Landeskoordinaten CH-1903
in geographische Koordinaten im WGS84-System

Die Umrechnung basiert auf folgendem Material des Bundesamtes fuer
Landestopographie der Schweiz, Wabern:
1. Schweizerisches Projektionssystem. Formeln fuer die 
Umrechnung von Landeskoordinaten in geographische 
Koordinaten und umgekehrt, 1984
2. Transformation von Landeskoordinaten CH-1903 in WGS-84 
Koordinaten, 1990
3. Ergaenzung zur Formelzusammenstellung fuer die Umrechnung
von WGS84-Koordinaten in Schweizerische Projektionskoordinaten
   
(c)	AMRON 2001
Norbert.Marwan AT gmx.net, Potsdam   */

	lambda = gradminsec2grad(L) / skale;
	phi = gradminsec2grad(B) / skale;
	h = H * 1.0;

	a = 6378137.000;
	e = 0.00669438000;

	Rn = a / Math.sqrt(1 - e * Math.pow(Math.sin(phi), 2));

	xWGS = (Rn + h) * Math.cos(phi) * Math.cos(lambda);
	yWGS = (Rn + h) * Math.cos(phi) * Math.sin(lambda);
	zWGS = (Rn * (1 - e) + h) * Math.sin(phi);

	dX = -660.075;
	dY = -13.551;
	dZ = -369.34;
	M = 0.99999436;
	alpha = (-2.485 / 10000) * Math.PI / 200;
	beta = (-1.783 / 10000) * Math.PI / 200;
	gamma = (-2.939 / 10000) * Math.PI / 200;

	xCH = dX + (M * (Math.cos(beta) * Math.cos(gamma) * xWGS + (Math.cos(alpha) * Math.sin(gamma) + (Math.sin(alpha) * Math.sin(beta) * Math.cos(gamma))) * yWGS + (Math.sin(alpha) * Math.sin(gamma) - (Math.cos(alpha) * Math.sin(beta) * Math.cos(gamma))) * zWGS));
	yCH = dY + (M * (-Math.cos(beta) * Math.sin(gamma) * xWGS + (Math.cos(alpha) * Math.cos(gamma) - (Math.sin(alpha) * Math.sin(beta) * Math.sin(gamma))) * yWGS + (Math.sin(alpha) * Math.cos(gamma) - (Math.cos(alpha) * Math.sin(beta) * Math.sin(gamma))) * zWGS));
	zCH = dZ + (M * (Math.sin(beta) * xWGS - (Math.sin(alpha) * Math.cos(beta) * yWGS) + (Math.cos(alpha) * Math.cos(beta)) * zWGS));

	a = 6377397.155;
	e = 0.006674372231;

	lCH = Math.atan(yCH / xCH);

	phiCH = 46.952405555 * Math.PI / 180;
	er = 1;
	while (er > 0.0000000000000001) {
		er = phiCH;
		Rn = a / Math.sqrt(1 - e * Math.pow(Math.sin(phiCH), 2));
		hCH = Math.sqrt(Math.pow(xCH, 2) + Math.pow(yCH, 2)) / Math.cos(phiCH) - Rn;
		phiCH = Math.atan((zCH / Math.sqrt(Math.pow(xCH, 2) + Math.pow(yCH, 2))) / (1 - Rn * e / (Rn + hCH)));
		er = Math.abs(er - phiCH);
	}

	B0 = 0.81947406867611;
	L0 = 0.1298452241431;
	b0 = 0.81869435858167;
	e = Math.sqrt(0.006674372230614);
	a = 6377397.155;
	K = 0.0030667323772751;
	alpha = 1.00072913843038;
	R = 6378815.90365;

	S = (alpha * Math.log(Math.tan((Math.PI / 4) + (phiCH / 2)))) - ((alpha * e / 2) * Math.log((1 + (e * Math.sin(phiCH))) / (1 - (e * Math.sin(phiCH))))) + K;

	phiCH = 2 * (Math.atan(Math.exp(S)) - Math.PI / 4);
	lCH = alpha * (lCH - L0);

	lambda = Math.atan(Math.sin(lCH) / ((Math.sin(b0) * Math.tan(phiCH)) + (Math.cos(b0) * Math.cos(lCH))));
	phi = Math.asin((Math.cos(b0) * Math.sin(phiCH)) - (Math.sin(b0) * Math.cos(phiCH) * Math.cos(lCH)));

	Y = 600000 + R * lambda;
	X = 200000 + (R / 2) * Math.log((1 + Math.sin(phi)) / (1 - Math.sin(phi)));

	Y = Math.round(Y * 10) / 10;
	X = Math.round(X * 10) / 10;
	H = Math.round(hCH * 10) / 10;

	var CH = {
		"H": H,
		"LkX": X,
		"LkY": Y
	};
	return CH;
}

function CH2WGS(X, Y, Z, GradMinSec) {
	B0 = 0.81947406867611;
	L0 = 0.1298452241431;
	b0 = 0.81869435858167;
	e = Math.sqrt(0.006674372230614);
	a = 6377397.155;
	K = 0.0030667323772751;
	alpha = 1.00072913843038;
	R = 6378815.90365;

	phi = 2 * (Math.atan(Math.exp((X - 200000) / R)) - Math.PI / 4);
	lambda = (Y - 600000) / R;

	lCH = Math.atan(Math.sin(lambda) / (-Math.sin(b0) * Math.tan(phi) + Math.cos(b0) * Math.cos(lambda)));
	phiCH = Math.asin(Math.cos(b0) * Math.sin(phi) + Math.sin(b0) * Math.cos(phi) * Math.cos(lambda));

	phi = B0;
	er = 1;
	while (er > 0.00000000000000000000000001) {
		er = phi;
		S = (1 / alpha) * (Math.log(Math.tan(Math.PI / 4 + phiCH / 2)) - K) + ((e / 2) * Math.log((1 + (e * Math.sin(phi))) / (1 - (e * Math.sin(phi)))));
		phi = 2 * (Math.atan(Math.exp(S)) - Math.PI / 4);
		er = Math.abs(er - phi);
	}

	l = lCH / alpha + L0;
	h = Z * 1.0;

	e = 0.006674372230614;
	a = 6377397.155;

	Rn = a / Math.sqrt(1 - e * Math.pow(Math.sin(phi), 2));

	xCH = (Rn + h) * Math.cos(phi) * Math.cos(l);
	yCH = (Rn + h) * Math.cos(phi) * Math.sin(l);
	zCH = (Rn * (1 - e) + h) * Math.sin(phi);

	dX = 660.075;
	dY = 13.551;
	dZ = 369.34;
	M = 1.00000566;
	alpha = (2.485 / 10000) * Math.PI / 200;
	beta = (1.783 / 10000) * Math.PI / 200;
	gamma = (2.939 / 10000) * Math.PI / 200;


	xWGS = dX + (M * (Math.cos(beta) * Math.cos(gamma) * xCH + (Math.cos(alpha) * Math.sin(gamma) + (Math.sin(alpha) * Math.sin(beta) * Math.cos(gamma))) * yCH + (Math.sin(alpha) * Math.sin(gamma) - (Math.cos(alpha) * Math.sin(beta) * Math.cos(gamma))) * zCH));
	yWGS = dY + (M * (-Math.cos(beta) * Math.sin(gamma) * xCH + (Math.cos(alpha) * Math.cos(gamma) - (Math.sin(alpha) * Math.sin(beta) * Math.sin(gamma))) * yCH + (Math.sin(alpha) * Math.cos(gamma) - (Math.cos(alpha) * Math.sin(beta) * Math.sin(gamma))) * zCH));
	zWGS = dZ + (M * (Math.sin(beta) * xCH - (Math.sin(alpha) * Math.cos(beta) * yCH) + (Math.cos(alpha) * Math.cos(beta)) * zCH));

	a = 6378137
	e = 0.00669438

	lambda = Math.atan(yWGS / xWGS);

	phi = 46.952405555 * Math.PI / 180
	er = 1
	while (er > 0.00000000000000000000000001) {
		er = phi
		Rn = a / Math.sqrt(1 - e * Math.pow(Math.sin(phi), 2))
		h = Math.sqrt(Math.pow(xWGS, 2) + Math.pow(yWGS, 2)) / Math.cos(phi) - Rn
		phi = Math.atan((zWGS / Math.sqrt(Math.pow(xWGS, 2) + Math.pow(yWGS, 2))) / (1 - Rn * e / (Rn + h)))
		er = Math.abs(er - phi)
	}

	h = Math.round(h * 10) / 10;

	var WGS = {
		"H": h,
		"Lat": "",
		"Lon": ""
	};
	if (GradMinSec) {
		WGS.Lat = grad2gradminsec(phi * 180 / Math.PI);
		WGS.Lon = grad2gradminsec(lambda * 180 / Math.PI);
	} else {
		WGS.Lat = phi * 180 / Math.PI
		WGS.Lon = lambda * 180 / Math.PI
	}
	return WGS;
}

function grad2gradminsec(X) {
	grad = Math.floor(X);
	min = 60 * (X - grad);
	min2 = Math.floor(min);
	sec = 60 * (min - min2);
	Y = grad + "°" + min2 + "'" + Math.round(sec * 100) / 100 + '"';
	return Y;
}

function gradminsec2grad(X) {
	werte = X.split(":");
	sec = werte[2] / 60;
	min = (1 * werte[1] + sec) / 60;
	Y = 1 * werte[0] + min;
	return Y;
}