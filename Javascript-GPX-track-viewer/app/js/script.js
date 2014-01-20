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
function doDraw(parser, droppedFileContent, map, filename) {
    var profilevis;
    document.title = 'Maliko Playback: ' + filename;
    $('#fileName').text(filename);

    var gpxData = parser.ParseGpx(droppedFileContent);

    // decide to draw stuff:
    if (gpxData.tracks.length == 0) {
        draw_profile = false;
        alert("This gpx files appears to have no trackpoints.  No chart or metadata will be displayed.");
    } else {
        draw_profile = true;
    }
    parser.DrawGpx(gpxData, true, true);

    // and update containers
    set_feature(draw_profile, 'profilegraph', function (el) {
        profilevis = new ProfileVisualizer(el);
    });
    if (draw_profile) {
        draw_profile = profilevis.drawGpx(gpxData, map);
    }

    if (draw_profile) {
        $('#promo').css("display", "block");
        $('#statuswell').css("display", "block");
        $('#malikoplayback').css("display", "block");
        $('#start').css("display", "block");
        $('#finish').css("display", "block");
        $('#profilebackground').css("display", "block");
    }
}


/* utility for testing to get query params
 */
function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function () {
            var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length, i = 0, s;
            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/')
    };
}

$(document).ready(function () {
    var testNumber, ajaxTestURL;
    var myURL = parseURL(location.href);
    if (myURL.params.testNumber != null) {
        testNumber = myURL.params.testNumber;
        var testInterval = (myURL.params.testInterval == null ? 5000 : myURL.params.testInterval);
        setTimeout(function () {
                window.location.assign("index.html?testNumber=" + testNumber);
            },
            testInterval);

    }
    $("#loadButton").click(function () {
        //console.log("loadButton called");
        if (window.top == window) {
            // you're not in a frame so you reload the site
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

    google.maps.event.addListenerOnce(map, 'idle', function () {
        $('#loading').hide();
        console.log('map idle');
    });

    if (testNumber && testNumber >= ajaxTestURLs.length) {
        testNumber = 0;
    }
    if (testNumber) {
        ajaxTestURL = ajaxTestURLs[testNumber++];
    }

    if (ajaxTestURL) {
        console.log(ajaxTestURL);
        $.ajax({ type: "GET",
            url: ajaxTestURL,
            async: false,
            success: function (text) {
                $('#loading').show();
                $('#dropalert').remove();
                doDraw(parser, text, map, ajaxTestURL);
            }
        });
        $('#fileName').text(ajaxTestURL);
    }

    $('body').initDrop(function (droppedFileContent, filename) {
        $('#dropalert').remove();
        $('#loading').show();
        doDraw(parser, droppedFileContent, map, filename);
        $('#loading').hide();
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
                    return '#fdbc11';
                }
                return colorFromRamp(speedramp, p2.spd);
                break;
            default:
                return '#fdbc11';
                break;
        }

    });
    parser.SetTrackWidth(4);

    return parser;
}