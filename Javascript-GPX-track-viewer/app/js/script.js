var ajaxTestURL; // = 'eight_ball_150.gpx'; //'eight_ball_150.gpx'
var draw_profile = false;


function set_feature(bool, id, callback) {
    var el = $('#' + id);
    if (bool) {
        $('body').addClass(id);
        if (callback != null)
            callback(el);
    } else {
        $('body').removeClass(id);
    }
}

// clone of the initDrop(), for testing
function ajax_parse_gpx(parser, updateLayout, droppedFileContent, map) {
    var profilevis;

   // $('#dropalert').remove();
    //document.title = 'GPX: ' + filename;

    var gpxData = parser.ParseGpx(droppedFileContent);

    // decide to draw stuff:
    if (gpxData.tracks.length == 0) {
        draw_profile = false;
    } else {
        draw_profile = true;
    }
    // and update containers
    set_feature(draw_profile, 'profilegraph', function (el) {
        profilevis = new ProfileVisualizer(el);
    });
    updateLayout();

    parser.DrawGpx(gpxData, true, true);
    if (draw_profile)
        profilevis.drawGpx(gpxData, map);
}


$(document).ready(function () {
    var updateLayout = function () {
        // height
        //var height = $(window).height();
        //var profileHeight = draw_profile ? $('#profilegraph').height() : 0;
        // DJH why ? // $('#mapwrapper').height(height - profileHeight);
    };

    var speedramp = [
        {value: 0, color: '#0000FF'},
        {value: 20, color: '#FF0000'},
        {value: 30, color: '#FF8000'},
        {value: 40, color: '#FFFF00'},
        {value: 60, color: '#00FF00'}
    ];

    writeLegend(speedramp);

    var map = createMap('map');
    var parser = createParser(map, speedramp);

    var profilevis;

    if (ajaxTestURL) {
       $.ajax({ type: "GET",
            url: ajaxTestURL,
            async: false,
            success: function (text) {
                $('#dropalert').remove();
                ajax_parse_gpx(parser, updateLayout, text, map);
            }
        });
    } else {
        $('body').initDrop(function (droppedFileContent, filename) {
            $('#dropalert').remove();

            document.title = 'GPX: ' + filename;

            var gpxData = parser.ParseGpx(droppedFileContent);

            // decide to draw stuff:
            if (gpxData.tracks.length == 0) {
                draw_profile = false;
            } else {
                draw_profile = true;
            }
            // and update containers
            set_feature(draw_profile, 'profilegraph', function (el) {
                profilevis = new ProfileVisualizer(el);
            });
            updateLayout();

            parser.DrawGpx(gpxData, true, true);
            if (draw_profile)
                profilevis.drawGpx(gpxData, map);
        });
    }
    // layout
    var resizeTimer = null;
    $(window).bind('resize', function () {
        //if (resizeTimer) clearTimeout(resizeTimer);
        //resizeTimer = setTimeout(updateLayout, 50);
        updateLayout();
    });

});

function writeLegend(ramp) {
    var out = '';
    for (i = 0; i < ramp.length; i++) {
        out += ' <b style="color: ' + ramp[i].color + '">';
        out += ramp[i].value;
        out += '</b>';
    }
    $('#promo').append('<p class="main-legend">Speed: ' + out + '</p>');
}

function createMap(mapElementId) {
    //var sf =  new google.maps.LatLng(37.86, -122.43);
    var myOptions = {
        zoom: 7,
        //center: sf,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    var map = new google.maps.Map(document.getElementById(mapElementId), myOptions);
    return map;
}

function createParser(map, speedramp) {
    var parser = new GPXParser(map);
    var coloring = 'speed';

    parser.SetSegmentColorProvider(function (p1, p2) {
        switch (coloring) {
            case 'speed':
                if (p2.spd != p2.spd) { // aka not a number
                    return '#FF00FF';
                }
                return colorFromRamp(speedramp, p2.spd);
                break;
            case 'slope':
                /*
                if (p2.elediff != p2.elediff
                    || p2.dst != p2.dst
                    ) { // aka not a number
                    return '#FF00FF';
                }
                var angle = Math.atan2(p2.elediff, p2.dst * 1000) * 180 / Math.PI; // <-180 - 180>
                return colorFromRamp(sloperamp, angle);
                break;
                */
            default:
                return '#FF00FF';
                break;
        }

    });
    parser.SetTrackWidth(4);
    // parser.SetMaxTrackPointDelta(0);

    return parser;
}