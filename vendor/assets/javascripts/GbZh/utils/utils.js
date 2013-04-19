function toggleSlide(el) {
	el = document.getElementById(el);
	el.style.display = (el.style.display === "block") ? "none" : "block";
}

var timerlen = 5;
var slideAniLen = 250;

var timerID = new Array();
var startTime = new Array();
var obj = new Array();
var endHeight = new Array();
var moving = new Array();
var dir = new Array();

var endHeightDynamic;

function getDynamicHeight(objname) {
	endHeightDynamic = document.getElementById(objname).scrollHeight;
	//LOG console.log(endHeightDynamic);
	return endHeightDynamic;
}

function startslide(objname) {
	obj[objname] = document.getElementById(objname);
	endHeight[objname] = getDynamicHeight(objname);
	startTime[objname] = (new Date()).getTime();

	if (dir[objname] === "down") {
		obj[objname].style.height = "1px";
	}
	obj[objname].style.display = "block";
	timerID[objname] = setInterval('slidetick(\'' + objname + '\');', timerlen);
}

function slidedown(objname) {
	if (moving[objname]) {
		return;
	}

	if (document.getElementById(objname).style.display !== "none") {
		return; // cannot slide down something that is already visible
	}

	moving[objname] = true;
	dir[objname] = "down";
	startslide(objname);
}

function slideup(objname) {
	if (moving[objname]) {
		return;
	}

	if (document.getElementById(objname).style.display === "none") {
		return; // cannot slide up something that is already hidden
	}
	moving[objname] = true;
	dir[objname] = "up";
	startslide(objname);
}

function endSlide(objname) {
	clearInterval(timerID[objname]);

	if (dir[objname] === "up") {
		obj[objname].style.display = "none";
	}
	obj[objname].style.height = endHeight[objname] + "px";

	delete (moving[objname]);
	delete (timerID[objname]);
	delete (startTime[objname]);
	delete (endHeight[objname]);
	delete (obj[objname]);
	delete (dir[objname]);

	return;
}

function slidetick(objname) {
	var elapsed = (new Date()).getTime() - startTime[objname];

	if (elapsed > slideAniLen) {
		endSlide(objname);
	} else {
		var d = Math.round(elapsed / slideAniLen * endHeight[objname]);
		if (dir[objname] === "up") {
			d = endHeight[objname] - d;
		}
		obj[objname].style.height = d + "px";
	}
	return;
}

function toggleSlide2(objname) {
	if (document.getElementById(objname).style.display === "none") {
    // div is hidden, so let's slide down
		slidedown(objname);
	} else {
    // div is not hidden, so slide up
		slideup(objname);

	}
	endHeight[objname] = getDynamicHeight(objname);
}

