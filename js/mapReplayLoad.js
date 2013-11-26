var path;

var textItem = new PointText({
    content: 'Click and drag to draw a line.',
    point: new Point(300, 440),
    fillColor: 'black'
});


// straw dog track; orig
var track = null;


function onMouseDown(event) {
    // If we produced a path before, deselect it:
    if (path) {
        path.selected = false;
    }

    // Create a new path and set its stroke color to black:
    path = new Path({
        segments: [event.point],
        strokeColor: 'black',
        // Select the path, so we can see its segment points:
        fullySelected: true
    });
}

// While the user drags the mouse, points are added to the path
// at the position of the mouse:
function onMouseDrag(event) {
    path.add(event.point);

    // Update the content of the text item to show how many
    // segments it has:
    textItem.content = 'Segment count: ' + path.segments.length;
}

// When the mouse is released, we simplify the path:
function onMouseUp(event) {
    var segmentCount = path.segments.length;

    // When the mouse is released, simplify it:
    path.simplify(10);

    // Select the path, so we can see its segments:
    path.fullySelected = true;

    var newSegmentCount = path.segments.length;
    var difference = segmentCount - newSegmentCount;
    var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';
}


var maxWidth = 640; //900;
var maxHeight = 480; // 700;
var maxPoint = new Point(maxWidth, maxHeight);
var randLine = new Path.Line();
randLine.strokeColor = 'black';
randLine.opacity = 0;
randLine.dashArray = [3, 3];
var pointCount = 0;

var boatIcons = new Array();
var numBoats = 50;
function newBoats() {
    for (var i = 0; i < numBoats; i++) {
        var currentPoint = new Path.Star(maxPoint * Point.random(), 3, 10, 3);
        currentPoint.strokeColor = 'black';
        currentPoint.strokeWidth = 2;
        boatIcons.push(currentPoint);
    }
}

newBoats();


var destPoint = maxPoint * Point.random();

function pointToLatLng(point) {
    var proj = map.getProjection();
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var neWorldXY = proj.fromLatLngToPoint(ne);
    var swWorldXY = proj.fromLatLngToPoint(sw);
    var curPixelX = point.x / Math.pow(2, map.getZoom());
    var curPixelY = point.y / Math.pow(2, map.getZoom());
    var curWorldX = curPixelX + swWorldXY.x;
    var curWorldY = curPixelY + neWorldXY.y;
    var curWorldPoint = new google.maps.Point(curWorldX, curWorldY);
    var curLatLng = proj.fromPointToLatLng(curWorldPoint);
    return curLatLng;
}

function latLngToPoint(latLng) {
    var proj = map.getProjection();
    var calWorldPoint = proj.fromLatLngToPoint(latLng);
    var calPixelPointx = calWorldPoint.x * Math.pow(2, map.getZoom());
    var calPixelPointy = calWorldPoint.y * Math.pow(2, map.getZoom());
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var neWorldPoint = proj.fromLatLngToPoint(ne);
    var swWorldPoint = proj.fromLatLngToPoint(sw);
    var ePixelPoint = neWorldPoint.x * Math.pow(2, map.getZoom());
    var nPixelPoint = neWorldPoint.y * Math.pow(2, map.getZoom());
    var wPixelPoint = swWorldPoint.x * Math.pow(2, map.getZoom());
    //var sPixelPoint = swWorldPoint.y * Math.pow(2, map.getZoom());
    var screenPixelX = calPixelPointx - wPixelPoint;
    var screenPixelY = calPixelPointy - nPixelPoint;
    var point = new Point(screenPixelX, screenPixelY);
    return point;
}

function calcRoute() {
    var start = startLatLng;
    var end = endLatLng;
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };
    dirService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            var dirPath = new Path();
            for (i = 0; i < result.routes[0].overview_path.length; i++) {
                var point = latLngToPoint(result.routes[0].overview_path[i]);
                dirPath.add(point);

                var hitRes = gridGroup.hitTest(point, {segments: true, fill: true, stroke: true, tolerance: 3});

                if (hitRes) {
                    var color = new Color('red');
                    color.alpha = gridRaster.getPixel(point / (maxWidth, maxHeight) * (87, 68)).alpha + 0.05;
                    //alert(gridRaster.getPixel(point/(maxWidth,maxHeight)*(87,68)).gray);
                    gridRaster.setPixel(point / (maxWidth, maxHeight) * (87, 68), color);
                }
            }
            travelPaths.push(dirPath);
            travelPaths[0].strokeColor = 'red';
            travelPaths[0].strokeWidth = 1;
            travelPaths[0].fullySelected = true;
            if (travelPaths.length > 1) {
                travelPaths[0].remove();
                travelPaths.shift();
                travelPaths[0].strokeColor = 'red';
                travelPaths[0].strokeWidth = 1;
                travelPaths[0].fullySelected = true;
            }
        }
    });
}


google.maps.event.addListener(map, 'tilesloaded', function () {
    //startLatLng = pointToLatLng(currentPoint.position);
});


var stepIndex = 0;
var stepSize = 5;
function tick() {
    if (!track) return;
    //console.log('track ' + track[stepIndex][0][1] + ' --- ' + boatIcons.length);
    for (var i = 0; i < boatIcons.length; i++) {
        console.log('track ' + track[stepIndex]);
        var latLng = new google.maps.LatLng(track[stepIndex][i][0], track[stepIndex][i][1], false);
        textItem.content = latLng.lat() + ', ' + latLng.lng();
        var p = latLngToPoint(latLng);
        boatIcons[i].position.x = p.x;
        boatIcons[i].position.y = p.y;
    }

    //console.log(p.x, p.y);
    //textItem.content = latLng.lat() + ', ' + latLng.lng();
    stepIndex += stepSize;
    if (stepIndex > track.length - 1) {
        stepIndex = 0;
    }
}

function setStepSize(buttonMode) {
    var cheat = 5;
    switch (buttonMode) {
        case 'forward':
            stepSize = cheat;
            break;
        case 'rewind':
            stepSize = -cheat;
            break;
        case 'fastforward':
            stepSize = 4 * cheat;
            break;
        case 'fastrewind':
            stepSize = -4 * cheat;
            break;
        case 'stop':
            stepSize = 0;
            break;
    }
}

var seconds = 0;
function onFrame(event) {

    tick();
    if (seconds != Math.floor(event.time)) {
        seconds = Math.floor(event.time);
    }


}

// used to center map
function corners() {
    var radius = 5;
    var myCircle = new Path.Circle(new Point(0, 0), radius);
    myCircle.fillColor = 'black';
    myCircle = new Path.Circle(new Point(0, maxHeight), radius);
    myCircle.fillColor = 'black';
    myCircle = new Path.Circle(new Point(maxWidth, 0), radius);
    myCircle.fillColor = 'black';
    myCircle = new Path.Circle(new Point(maxWidth, maxHeight), radius);
    myCircle.fillColor = 'black';
}

corners();

var y = -50;
//var uiValue = 0;

$(function () {
    $("#sliderOpacity").slider({
        value: 0.0,
        step: 1.0,
        min: 0,
        max: 11000,
        slide: function (event, ui) {
            setStepSize('stop');
            stepIndex = ui.value;
            //console.log(ui.value);
        },
        stop: function (event, ui) {
        }
    }).attr("title", "Opacity Control");
    // $('.ui-slider-handle').height(50);
});


function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    //document.getElementById('emailLink').style.visibility = 'visible';
    //theURL = 'mailto:dwiens@edynamics.com?subject=GPX file&body=Attach GPX file';
    var reader = new FileReader();
    reader.onloadend = function (evt) {

        var parseXml;
        if (typeof window.DOMParser != "undefined") {
            parseXml = function (xmlStr) {
                return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
            };
        } else if (typeof window.ActiveXObject != "undefined" &&
            new window.ActiveXObject("Microsoft.XMLDOM")) {
            parseXml = function (xmlStr) {
                var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                xmlDoc.loadXML(xmlStr);
                return xmlDoc;
            };
        } else {
            throw new Error("No XML parser found");
        }
        var xml = parseXml(evt.target.result);


        if (evt.target.readyState == FileReader.DONE) {
            var parser = new GPXParser(xml, map);
            parser.setTrackColour("#ff0000");     // Set the track line colour
            parser.setTrackWidth(1);          // Set the track line width
            parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
            track = parser.centerAndZoom(xml);
            parser.addTrackpointsToMap();         // Add the trackpoints
            parser.addWaypointsToMap();           // Add the waypoints
        }
    };
    reader.readAsText(files[0]);

}

// open and load GPX Section
$(function (view) {
    "use strict";

    // inside of jquery so document is loaded
    document.getElementById('file').addEventListener('change', handleFileSelect, false);

    // The canvas drawing portion of the demo is based off the demo at
    // http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
    $("#text-options").submit(function (event) {
        event.preventDefault();

        var blob = new Blob([JSON.stringify(track)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "track.json");

    });


    // parse gpx
    function parseGPX(gpx) {
        var parseXml;
        if (typeof window.DOMParser != "undefined") {
            parseXml = function (xmlStr) {
                return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
            };
        } else if (typeof window.ActiveXObject != "undefined" &&
            new window.ActiveXObject("Microsoft.XMLDOM")) {
            parseXml = function (xmlStr) {
                var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                xmlDoc.loadXML(xmlStr);
                return xmlDoc;
            };
        } else {
            throw new Error("No XML parser found");
        }
        var xml = parseXml(gpx);

        var parser = new GPXParser(xml, map);
        parser.setTrackColour("#ff0000");     // Set the track line colour
        parser.setTrackWidth(1);          // Set the track line width
        parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
        track = parser.centerAndZoom(xml);
        parser.addTrackpointsToMap();         // Add the trackpoints
        parser.addWaypointsToMap();           // Add the waypoints
    }


    $.ajax({ type: "GET",
        url: "eight_ball.gpx",
        async: false,
        success: function (text) {
            parseGPX(text);
        }
    });

});

