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
        title:"Start",
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
            backgroundColor:'rgba(255, 255, 255, 0.8)'
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
                    left:0
                }
            },
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            plotBands: [{
                from: 59000,
                to: 61000,
                color: 'rgba(255, 255, 255, 0.3)',
                zIndex: 1
            }, {
                    from: 119000,
                    to: 121000,
                    color: 'rgba(255, 255, 255, 0.3)',
                    zIndex: 1
            }, {
                from: 179000,
                to: 181000,
                color: 'rgba(255, 255, 255, 0.3)',
                zIndex: 1
            }, {
                from: 229000,
                to: 241000,
                color: 'rgba(255, 255, 255, 0.3)',
                zIndex: 1
            }, {
                from: 299000,
                to: 301000,
                color: 'rgba(255, 255, 255, 0.3)',
                zIndex: 1
            }]
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

            plotBands: [{
                from: 0,
                to: 4,
                color: 'rgba(168, 168, 168, 0.5)'
            }, {
                from: 4,
                to: 5,
                color: 'rgba(255, 255, 255, 0.3)'
            }, {
                from: 5,
                to:9 ,
                color: 'rgba(184, 184, 184, 0.5)'

            }, {
                from: 9,
                to: 10,
                color: 'rgba(0, 0, 0, 0)'
            }, {
                from: 10,
                to: 14,
                color: 'rgba(200, 200, 200, 0.5)'

            }, {
                from: 14,
                to: 15,
                color: 'rgba(0, 0, 0, 0)'
            }, {
                from: 15,
                to: 19,
                color: 'rgba(216, 216, 316, 0.5)'
            }, {
                from: 19,
                to: 20,
                color: 'rgba(0, 0, 0, 0)'
            }, {
                    from: 20 ,
                    to: 24,
                    color: 'rgba(200, 200, 200, 0.5)'

                }, {
                    from: 24,
                    to: 25,
                    color: 'rgba(0, 0, 0, 0)'
                }, {
                    from: 25,
                    to: 29,
                    color: 'rgba(216, 216, 316, 0.5)'
            }]
            //,min: 0
        },
        tooltip: {
            crosshairs: true,
            formatter: function () {
                // DJH I tried index, id
                var tooltip = "<b>Speed: " + parseFloat(this.y).toFixed(2) + " mph</b><br>";
                tooltip += "<b>Time: " + Highcharts.dateFormat('%H:%M:%S', this.x) + "</b>";
                //+ this.y + ' m ' + this.point.lat + ' ' + this.point.lon;
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
                    radius: 8,
                    lineColor: 'white',
                    lineWidth: 3
                } //,
                //pointInterval: 3600000, // one hour
                //pointStart: Date.UTC(2009, 9, 6, 0, 0, 0)
            },
            series: {
                point: {
                    events: {
                        mouseOver: function() {
                            // debug
                            console.log(this.x, this.y, this.lat, this.lon);
                            var _position = new google.maps.LatLng(this.lat,this.lon);

                            if (marker)
                            {
                                marker.setPosition(new google.maps.LatLng(this.lat,this.lon));
                                marker.setTitle(this.lon.currentPosition);
                            }
                        },
                        mouseOut: function() {
                            // debug console.log('mouseOut - point');
                            // TODO remove marker?
                        }
                    }
                },
                events: {
                    mouseOut: function() {
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
