var ajaxTestURL; // = 'eight_ball_150.gpx';
var draw_profile = false;


// jQuery removeClass removes the css class
// http://api.jquery.com/removeClass/
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
function ajax_parse_gpx(parser, droppedFileContent, map) {
    var profilevis;

    // $('#dropalert').remove();
    //document.title = 'Maliko Replay: ' + filename;

    var gpxData = parser.ParseGpx(droppedFileContent);

    // decide to draw stuff:
    if (gpxData.tracks.length == 0) {
        draw_profile = false;
        alert("This gpx files appears to have no trackpoints.  No chart or metadata will be displayed.");
    } else {
        draw_profile = true;
    }
    // and update containers
    set_feature(draw_profile, 'profilegraph', function (el) {
        profilevis = new ProfileVisualizer(el);
        if (draw_profile) {
            $('#promo').css("display","block");
            $('#statuswell').css("display","block");
            $('#malikoplayback').css("display","block");
            $('#start').css("display","block");
            $('#finish').css("display","block");
            $('#profilebackground').css("display","block");
        }
    });

    parser.DrawGpx(gpxData, true, true);
    if (draw_profile)
        profilevis.drawGpx(gpxData, map);
}


$(document).ready(function () {

    $( "#loadButton" ).click(function() {
       //console.log("loadButton called");
        if(window.top==window) {
            // you're not in a frame so you reload the site
           // window.setTimeout('location.reload()', 3000); //reloads after 3 seconds
            location.reload();
        } else {
            //you're inside a frame, so you stop reloading
        }
    });


//    var speedramp = [
//        {value: 0, color: '#0000FF'},
//        {value: 20, color: '#FF0000'},
//        {value: 30, color: '#FF8000'},
//        {value: 40, color: '#FFFF00'},
//        {value: 60, color: '#00FF00'}
//    ];

    var speedramp = [
        {value: 0, color: '#fdbc11'},
        {value: 20, color: '#fdbc11'},
        {value: 30, color: '#fdbc11'},
        {value: 40, color: '#fdbc11'},
        {value: 60, color: '#fdbc11'}
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
                ajax_parse_gpx(parser, text, map);
            }
        });
        $('#fileName').text(ajaxTestURL);
    } else {
        $('body').initDrop(function (droppedFileContent, filename) {
            $('#dropalert').remove();
            document.title = 'Maliko Playback: ' + filename;
            $('#fileName').text(filename);
            var gpxData = parser.ParseGpx(droppedFileContent);

            // decide to draw stuff:
            if (gpxData.tracks.length == 0) {
                draw_profile = false;
                alert("This gpx files appears to have no trackpoints.  No chart or metadata will be displayed.");
                $('#profilegraph').css("display","none");
            } else {
                draw_profile = true;
            }
            // and update containers
            set_feature(draw_profile, 'profilegraph', function (el) {
                profilevis = new ProfileVisualizer(el);
                if (draw_profile) {
                    $('#promo').css("display","block");
                    $('#statuswell').css("display","block");
                    $('#malikoplayback').css("display","block");
                    $('#start').css("display","block");
                    $('#finish').css("display","block");
                    $('#profilebackground').css("display","block");
                }
            });

            parser.DrawGpx(gpxData, true, true);
            if (draw_profile)
                profilevis.drawGpx(gpxData, map);
        });
    }
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
            default:
                return '#FF00FF';
                break;
        }

    });
    parser.SetTrackWidth(4);
    // parser.SetMaxTrackPointDelta(0);

    return parser;
}