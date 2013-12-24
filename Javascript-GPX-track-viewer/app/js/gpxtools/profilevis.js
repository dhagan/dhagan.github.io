function ProfileVisualizer(jqelement) {
    this.jqelement = jqelement;
}

ProfileVisualizer.prototype.drawGpx = function (gpxdata, map) {
    var series = [];
    var segmentCounter = 0;

    func.map(gpxdata.tracks, this, function (track) {
        func.map(track.segments, this, function (segment) {
            if (track.segments.length > 0 && track.segments[0].points.length > 0) {
                var starttime = track.segments[0].points[0].time;
                var endtime = track.segments[track.segments.length - 1].points[track.segments[track.segments.length - 1].points.length - 1].time;
            }

            var segmentdata = {
                name: 'segment ' + ++segmentCounter,
                data: []
            };

            var bufferSum = 0;
            var bufferCnt = 0;

            func.map(segment.points, this, function (point) {
                if (point.ele != undefined) {
                    bufferSum += point.ele;

                    if (++bufferCnt == 5) {
                        var ele = Math.round(bufferSum / 5);
                        // var time = point.time;
                        var time = point.time - starttime;
                        var speed = point.spd;
                        var _point = { x: time, y: speed, lat: point.lat, lon: point.lon};
                        //var _point = { y: time, x: ele};
                        segmentdata.data.push(_point);
                        //segmentdata.data.push([time, ele]);

                        bufferCnt = 0;
                        bufferSum = 0;
                    }

                    // segmentdata.data.push([point.time, point.ele]);
                }
            });

            series.push(segmentdata);
        });
    });

    // !!!
    // TODO: map, markers does not belong in profile code
    // !!!

    // TODO change me to gold
    //var color = 'rgba(255, 0, 0, 1)'; //

    var circle = { //set up icon
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'gold',
        fillOpacity: 1,
        scale: 8,
        strokeColor: "white",
        strokeWeight: 3
    };


    var marker = new google.maps.Marker({
        //position: new google.maps.LatLng(first[0], first[1]),
        title: "Start",
        icon: circle,
        map: map,
        zIndex: 10
    });

    this._chartSeries(series, marker);
}

ProfileVisualizer.prototype._chartSeries = function (seriesdata, marker) {
    this.jqelement.html('');

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: this.jqelement.attr('id'),
            type: 'spline',
            backgroundColor: 'rgba(255, 255, 255, 0.0)'
        },
        title: {
            text: ''
        },
        subtitle: {
            text: ''
        },
        legend: {
            enabled: false
        },
        xAxis: {
            title: {
                //DKH this seems to be broken -- align: middle,
                text: 'Time (hh:mm)',
                style: {
                    left: 0
                }
            },
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            plotBands: [
                {
                    value: 60000,
                    width: 2.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                },
                {
                    value: 120000,
                    width: 2.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                },
                {
                    value: 180000,
                    width: 2.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                },
                {
                    value: 240000,
                    width: 2.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                },
                {
                    value: 300000,
                    width: 2.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                }
            ]
            /*
             plotLines : [{
             value : 30000,
             color : 'green',
             dashStyle : 'shortdash',
             width : 2,
             label : {
             text : 'Last quarter minimum'
             }
             }, {
             value : 40000,
             color : 'red',
             dashStyle : 'shortdash',
             width : 2,
             label : {
             text : 'Last quarter maximum'
             }
             }]
             */
        },
        yAxis: {
            title: {
                text: 'Speed (mph)'
            },
            min: 0,
            minorGridLineWidth: 0,
            gridLineWidth: 0,

            plotBands: [
                {
                    from: 0,
                    to:0.5,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 0.5,
                    to: 4.75,
                    color: 'rgba(168, 168, 168, 1.0)'
                },
                {
                    from: 4.75,
                    to: 5.25,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 5.25,
                    to: 10.0,
                    color: 'rgba(184, 184, 184, 1.0)'

                },
                {
                    from: 10.0,
                    to: 10.25,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 10.25,
                    to: 14.75,
                    color: 'rgba(200, 200, 200, 1.0)'

                },
                {
                    from: 14.75,
                    to: 15.25,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 15.25,
                    to: 19.75,
                    color: 'rgba(216, 216, 216, 1.0)'
                },
                {
                    from: 19.75,
                    to: 20.25,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 20.25,
                    to: 24.75,
                    color: 'rgba(200, 200, 200, 1.0)'

                },
                {
                    from: 24.75,
                    to: 25.25,
                    color: 'rgba(255, 255, 255, 0.8)'
                },
                {
                    from: 25.25,
                    to: 29.75,
                    color: 'rgba(216, 216, 316, 1.0)'
                }
            ]
            //,min: 0
        },
        tooltip: {
            crosshairs: true,
            shared: false,
            useHTML: true,
            borderWidth: 0,
            shadow: false,
            backgroundColor: 'rgba(255,255,255,0)',
            useHTML: true,
            formatter: function () {
               var speed =  "<b>SPEED: </b>" + parseFloat(this.y).toFixed(2) + " mph";
               var time =   "<b>&nbsp;&nbsp;TIME: </b>" + Highcharts.dateFormat('%H:%M:%S', this.x);
               var tooltip =  '<div class="myTooltip" style="background-color:' + this.series.color + ';">' + speed + '<br/>' + time + '</div>';
               return tooltip;
            }
        },
        plotOptions: {
            spline: {
                lineWidth: 4,
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                marker: {
                    enabled: false,
                    radius: 5,
                    lineColor: 'white',
                    lineWidth: 1
                } //,
                //pointInterval: 3600000, // one hour
                //pointStart: Date.UTC(2009, 9, 6, 0, 0, 0)
            },
            series: {
                point: {
                    events: {
                        mouseOver: function () {
                            // debug
                            console.log(this.x, this.y, this.lat, this.lon);
                            var _position = new google.maps.LatLng(this.lat, this.lon);

                            if (marker) {
                                marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
                                marker.setTitle(this.lon.currentPosition);
                            }
                        },
                        mouseOut: function () {
                            // debug console.log('mouseOut - point');
                            // TODO remove marker?
                        }
                    }
                },
                events: {
                    mouseOut: function () {
                        // debug console.log('mouseOut - chart');
                        //hoverMarker.setVisible(false);
                        // TODO remove marker?
                    }
                },
                // TODO investigate turboThreshold implications
                // http://api.highcharts.com/highcharts#plotOptions.series.turboThreshold
                turboThreshold: 0
            }


        },

        series: seriesdata
    });
}
