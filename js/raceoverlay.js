/**
 * Race+sparkles custom overlay.
 */
RaceOverlay.prototype = new google.maps.OverlayView();

/**
 * Race overlay.
 * @constructor
 * @param {Array} markers Initial array of markers.
 * @param {Map} map Map to put overlay on.
 */
function RaceOverlay(_track, _map) {
    this.track = _track;
    this.setMap(_map);
    this.numBoats = 50;
    this.stepIndex = 0;
    this.stepIndexSize = 5;
}

/**
 * Create race objects
 * @private
 */
RaceOverlay.prototype._setSize = function () {
    this.paperCenter = this.getProjection().fromLatLngToDivPixel(this.getMap().getCenter());
    this.paperWidth = Math.min(this.getProjection().getWorldWidth(), 60000);
    this.paperHeight = Math.min(this.getProjection().getWorldWidth(), 60000);
    this.div.style.left = this.paperCenter.x - this.paperWidth / 2 + 'px';
    this.div.style.top = this.paperCenter.y - this.paperHeight / 2 + 'px';
    this.div.style.width = this.paperWidth + 'px';
    this.div.style.height = this.paperHeight + 'px';

    this.paper.setSize(this.paperWidth, this.paperHeight);
}

/**
 * Convert lan/lng map coordinates to the paper point coordinates.
 */
RaceOverlay.prototype._fromLatLngToCanvasPixel = function (latLng) {
    var divPixel = this.getProjection().fromLatLngToDivPixel(latLng);
    var left = this.paperCenter.x - this.paperWidth / 2;
    var top = this.paperCenter.y - this.paperHeight / 2;
    var x = divPixel.x - left;
    var y = divPixel.y - top;
    var paperPixel = new google.maps.Point(x, y);

    return paperPixel;
};

/**
 * Convert paper point coordinates to the lan/lng map coordinates.
 */
RaceOverlay.prototype._fromCanvasPixelToLatLng = function (paperPixel) {
    // borders of the map
    var left = this.paperCenter.x - this.paperWidth / 2;
    var top = this.paperCenter.y - this.paperHeight / 2;
    // point coordinates on the paper layer
    var x = paperPixel.x + left;
    var y = paperPixel.y + top;
    var divPixel = new google.maps.Point(x, y);
    var latLng = this.getProjection().fromDivPixelToLatLng(divPixel);

    return latLng;
};


/**
 * Create initial divs and paperes for races.
 * Called when race overlay is added to map initially.
 */
RaceOverlay.prototype.onAdd = function () {
    var me = this;
    var panes = this.getPanes();
    //for (var i = 0; i < this.numRaces; i++) {
    this.div = document.createElement('DIV');
    this.div.style.border = '0px solid';
    this.div.style.position = 'absolute';
    this.div.style.overflow = 'visible';
    //this.races[i].div = div;
    panes.overlayImage.appendChild(this.div);
    this.paper = Raphael(this.div);

    this.starsTimer_ = window.setInterval(function () {
        me.animateRace();
    }, 10);
};

/**
 * Draws race overlay - race part.
 */
RaceOverlay.prototype.draw = function () {
    if (!this.getProjection()) {
        return;
    }
    var sf = new google.maps.LatLng(37.86, -122.43);
    this._setSize();

    var p = this._fromLatLngToCanvasPixel(sf);
    star = this.paper.g.star(p.x, p.y, 10);
    star.attr({stroke: 'none', fill: '90-#fff-#fff'});
    console.log(p.x, p.y);

//    var divPixel = this.getProjection().fromLatLngToDivPixel(sf);
//    star = this.paper.g.star(divPixel.x, divPixel.y, 5);
//    star.attr({stroke: 'none', fill: '90-#fff-#fff'});
//    console.log(divPixel.x, divPixel.y);

    this.animateRace();
};


RaceOverlay.prototype._drawBoats = function(me) {
    me.paper.clear();
    for (var i = 0; i < me.numBoats; i++) {
        var sf = new google.maps.LatLng(me.track[me.stepIndex][i][0], me.track[me.stepIndex][i][1]);
        var p = me._fromLatLngToCanvasPixel(sf);
        star = me.paper.g.star(p.x, p.y, 10);
        star.attr({stroke: 'none', fill: '90-#fff-#fff'});
        //console.log(p.x, p.y);
    }
}
/**
 * Generates animated stars for current location.
 */
RaceOverlay.prototype.animateRace = function () {
    RaceOverlay.prototype._drawBoats(this);
    this.stepIndex+= this.stepIndexSize;
};

RaceOverlay.prototype.forward = function () {
    var me = this;
    this.stepIndexSize = 5;
    console.log('forward()');
    window.clearInterval(me.starsTimer_);
    this.starsTimer_ = window.setInterval(function () {
        me.animateRace();
    }, 10);
};

RaceOverlay.prototype.rewind = function () {
    var me = this;
    this.stepIndexSize = -5;
    console.log('rewind()');
    window.clearInterval(me.starsTimer_);
    this.starsTimer_ = window.setInterval(function () {
        me.animateRace();
    }, 10);
};

RaceOverlay.prototype.setIndex = function (value) {
    var me = this;
    window.clearInterval(me.starsTimer_);
    console.log('index ' + value);
    this.stepIndexSize = 0;
    this.stepIndex = value;
    RaceOverlay.prototype._drawBoats(this);
};

/**
 * Called when overlay is removed from map.
 * Removes references to objects.
 */
RaceOverlay.prototype.onRemove = function () {
//    for (var i = 0; i < this.markers.length; i++) {
//        var race = this.races[i];
//        // Check if race exists before continuing
//        if (!race) {
//            continue;
//        }
//        // Remove race circle
//        // Should exist by the time it's removed from the map,
//        // but on the safe side, check for existence.
//        // Edge case: Someone loading map 2 seconds before the flight ends.
//        if (race.circle) {
//            race.circle.remove();
//            race.circle = null;
//        }
//        // Remove stars
//        for (var j = 0; j < race.stars.length; j++) {
//            if (race.stars[j]) {
//                race.stars[j].remove();
//                race.stars[j] = null;
//            }
//        }
//    }
//    // Stop the timer that creates stars.
    window.clearInterval(this.starsTimer_);
};

