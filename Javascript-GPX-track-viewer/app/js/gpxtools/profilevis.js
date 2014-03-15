var chart;

function ProfileVisualizer(jqelement) {
    this.jqelement = jqelement;
}

ProfileVisualizer.prototype.drawGpx = function (gpxdata, map) {
    var series = [];
    var trackCounter = 0;
    var segmentCounter = 0;
    var stats = {};  // starttime, endtime, speed, maxSpeed, distance
    stats.speed = 0;
    stats.maxSpeed = 0;
    that = this;

    func.map(gpxdata.tracks, this, function (track) {
        //console.log('track count ' + trackCounter++);
        segmentCounter = 0;
        func.map(track.segments, this, function (segment) {
            if (track.segments.length > 0 && track.segments[0].points.length > 0) {
                var starttime = track.segments[0].points[0].time;
                var endtime = track.segments[track.segments.length - 1].points[track.segments[track.segments.length - 1].points.length - 1].time;
                stats.starttime = starttime;
                stats.endtime = endtime;
                stats.distance = segment.length;
            }

            var bufferSum = 0;
            var bufferCnt = 0;
            // set the sample rate - 1000 points per track
            var sampleSize = Math.ceil(track.segments[segmentCounter].points.length / 1000);

            var segmentdata = {
                name: 'Track ' + trackCounter + ' - Segment ' + ++segmentCounter,
                data: []
            };

            // set the color of the series if it is 1
            if (trackCounter == 1) {
                segmentdata['color'] = '#0097cd';
            }

            func.map(segment.points, this, function (point) {
                if (point.ele != undefined) {
                    bufferSum += point.spd;
                    if (!isNaN(point.spd)) {
                        stats.speed += point.spd;
                        stats.maxSpeed = Math.max(stats.maxSpeed, point.spd);
                    }

                    if (++bufferCnt == sampleSize) {
                        var speed = Math.round(bufferSum / sampleSize);
                        var time = point.time - starttime;
                        if (!isNaN(time) && !isNaN(speed)) {
                            var _point = { x: time, y: speed, lat: point.lat, lon: point.lon};
                            segmentdata.data.push(_point);
                        }
                        bufferCnt = 0;
                        bufferSum = 0;
                    }
                }
            });

            series.push(segmentdata);
            if (segment.points.length) {
                stats.speed = stats.speed / segment.points.length;
            }
            //console.log('segment length ' +  segment.points.length);
        });
    });

    // !!!
    // TODO: map, markers does not belong in profile code
    // !!!


    var circle = { //set up icon
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#fdbc11', //''gold',
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
        zIndex: 10,
        draggable: true
    });

    function closestLocation(targetLocation, locationData) {
        function vectorDistance(dx, dy) {
            return Math.sqrt(dx * dx + dy * dy);
        }

        function locationDistance(location1, location2) {
            var dx = location1.lat - location2.lat,
                dy = location1.lon - location2.lon;

            return vectorDistance(dx, dy);
        }

        // next time use underscore.js
        return locationData.reduce(function (prev, curr) {
            var prevDistance = locationDistance(targetLocation, prev),
                currDistance = locationDistance(targetLocation, curr);
            return (prevDistance < currDistance) ? prev : curr;
        });
    }

    google.maps.event.addListener(marker, 'drag', function (event) {
        //console.log(event.latLng.lat(), event.latLng.lng());
        var currentLocation = {
            lat: event.latLng.lat(),
            lon: event.latLng.lng()
        }
        var nearestLocation = closestLocation(currentLocation, series[0].data);

        // TODO: fix me - very lazy, cycle through the array again.
        var index = 0;
        for (var i = 0; i < chart.series[0].data.length; i++) {
            if (chart.series[0].data[i].x == nearestLocation.x) {
                index = i;
                break;
            }
        }

        that._removeCrossHairs();
        marker.setPosition(new google.maps.LatLng(nearestLocation.lat, nearestLocation.lon));
        if (typeof nearestLocation != 'undefined') {
            chart.tooltip.refresh(chart.series[0].data[index]);
            that._addCrossHairs(nearestLocation, index, true);
        }
    });

    google.maps.event.addListener(marker, 'dragend', function (event) {
        chart.tooltip.hide();
        that._removeCrossHairs();
    });
    if (series[0].data.length > 0) {
        this._chartSeries(series, marker);
        $('#distance').text(parseFloat(stats.distance).toFixed(2) + ' mi');
        $('#time').text(Highcharts.dateFormat("%H:%M:%S", stats.endtime - stats.starttime));
        $('#speed').text(parseFloat(stats.speed).toFixed(2) + ' mph');
        $('#maxSpeed').text(parseFloat(stats.maxSpeed).toFixed(2) + ' mph');
        return true;
    } else {
        alert("This gpx files appears to have no time data.  No chart will be displayed.");
        return false;
    }
}

var initialMarkerIndex = 12;
var firstMouseOver = true;
ProfileVisualizer.prototype._chartSeries = function (seriesdata, marker) {

    var that = this;
    this.jqelement.html('');
    chart = new Highcharts.Chart({
        chart: {
            renderTo: this.jqelement.attr('id'),
            type: 'spline',
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            events: {
                redraw: function () {
                    //console.log('chart.redraw()');
                    renderPlotLines(this);
                },
                load: function (event) {
                    //$('#loading').hide();
                    //console.log('hiding');
                }
            }
        },
        colors: [
            '#0097cd', // '#4572A7', // DJH this is custom 1/28/2014
            '#AA4643',
            '#89A54E',
            '#80699B',
            '#3D96AE',
            '#DB843D',
            '#92A8CD',
            '#A47D7C',
            '#B5CA92'
        ],
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
            min: 0,
            title: {
                text: 'Time (hh:mm)',
                style: {
                    left: 0,
                    color: '#808284',
                    fontWeight: 'bold',
                    fontFace: 'Open Sans'
                },
                //x: 0 // left justify
                align: 'low'
            },
            type: 'datetime',
            // remove gridlines
            lineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
                "formatter": function () {
                    return Highcharts.dateFormat("%H:%M", this.value)
                },
                y: 20, // move down to accommodate border0
                overflow: 'justify',
                style: {
                    color: '#58585b'
                }

            },
            startOnTick: true,
            showLastLabel: true,
            endOnTick: true
        },
        yAxis: {
            title: {
                text: 'Speed (mph)',
                style: {
                    left: 0,
                    color: '#808284',
                    fontWeight: 'bold',
                    fontFace: 'Open Sans'
                }
            },
            min: 0,
            lineWidth: 0,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
                x: -15, // move left to accommodate border
                style: {
                    color: '#58585b'
                }
            }
        },

        tooltip: {
            crosshairs: false,
            shared: false,
            useHTML: true,
            borderWidth: 0,
            shadow: false,
            backgroundColor: 'rgba(255,255,255,0)',
            useHTML: true,
            formatter: function () {
                var speed = '<b style="color: #a7d9ec;">SPEED: </b>' + parseFloat(this.y).toFixed(2) + " mph";
                var time = '<b style="color: #a7d9ec;">&nbsp;&nbsp;TIME: </b>' + Highcharts.dateFormat('%H:%M:%S', this.x);
                var tooltip = '<div class="myTooltip" style="background-color:' + this.series.color + ';">' + speed + '<br/>' + time + '</div>';
                return tooltip;
            }
        },
        plotOptions: {
            spline: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 3
                    }
                },
                marker: {
                    enabled: false,
                    radius: 5,
                    lineColor: 'white',
                    lineWidth: 1
                }
            },
            series: {
                point: {
                    events: {
                        mouseOver: function () {
                            //console.log(this.x, this.y, this.lat, this.lon);
                            //console.log('mouseOver');
                            // clean up initial hint chart marker
                            if (firstMouseOver) {
                                var p = chart.series[0].points[initialMarkerIndex];
                                if (p) {
                                    p.update({
                                        marker: {
                                            enabled: false,
                                            radius: 7,
                                            lineColor: 'white',
                                            lineWidth: 2
                                        }
                                    });
                                    firstMouseOver = false;
                                }
                            }
                            var _position = new google.maps.LatLng(this.lat, this.lon);

                            if (marker) {
                                marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
                                marker.setTitle(this.lon.currentPosition);
                            }

                            var nearestLocation = {
                                'x': this.x,
                                'y': this.y
                            };
                            that._addCrossHairs(nearestLocation, this.index, false);
                        },
                        mouseOut: function () {
                            that._removeCrossHairs();
                        }
                    }
                },
                events: {
                    mouseOut: function () {
                        that._removeCrossHairs();
                    },
                    mouseOver: function () {
                        that._removeCrossHairs();
                    }
                },
                // TODO investigate turboThreshold implications
                // http://api.highcharts.com/highcharts#plotOptions.series.turboThreshold
                turboThreshold: 10000
                //color: '#0097cd'
            }


        },

        series: seriesdata
    });

    //
    //
    // render the plotlines
    //
    //
    function renderPlotLines(chart) {

        //console.log('reanderPlotLines');
        $("#xAxisDark").remove();
        $("#xAxisLight").remove();

        var grey = [
            'rgba(234, 235, 236, 1.0)',
            'rgba(241, 241, 242, 1.0)',
            'rgba(247,247,248,1.0)',
            'rgba(255, 255, 255, 1.0)',
            'rgba(247,247,248,1.0)'
        ];


        // yaxis plotlines and gradient
        var maxTick = chart.yAxis[0].tickPositions[chart.yAxis[0].tickAmount - 1];
        for (var i = 0; i <= 8; i++) {
            var _value = maxTick * (i / 8);
            var _color = 'rgba(255, 255, 255, 0.8)';
            var _width = 2.5;
            if (i % 2) {
                //console.log(i);
                var _color = grey[(i - 1) / 2];
                var _width = 21.0;
            }

            if (i == 8) {
                _witth = 0;
            }

            //console.log ( _value, _width, _color);
            chart.yAxis[0].addPlotLine({
                value: _value,
                width: _width,
                color: _color,
                zIndex: 1
            });
        }

        // xaxis plotlines
        chart.xAxis[0].addPlotLine({
            value: chart.xAxis[0].min,
            width: 2.5,
            color: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1
        });

        for (var i = 0; i <= chart.xAxis[0].tickPositions.length; i++) {
            var _width = 2.5;
            var _color = 'rgba(255, 255, 255, 0.8)';
            if (i == chart.xAxis[0].tickPositions.length - 1) {
                _width = 1;
                //_color =  'rgba(255, 0, 0, 0.8)';
            }
            chart.xAxis[0].addPlotLine({
                value: chart.xAxis[0].tickPositions[i],
                width: _width,
                color: _color,
                zIndex: 1
            });
        }

        // add styled xaxis
        var xaxis_x1 = chart.plotBox.x;
        var xaxis_y1 = chart.plotBox.y + chart.plotBox.height + 5; // odd, 5 is half the stroke-width
        var xaxis_x2 = xaxis_x1 + chart.plotBox.width;

        // add the first segment for the xAxis style
        var stroke_width = 10;
        var tickDivisions = 6;
        var tickPixel0 = chart.xAxis[0].toPixels(chart.xAxis[0].tickPositions[0]);
        var tickPixel1 = chart.xAxis[0].toPixels(chart.xAxis[0].tickPositions[1]);
        var tickPixelDelta = (tickPixel1 - tickPixel0) / tickDivisions;
        var stroke_dasharray = tickPixelDelta + ',' + tickPixelDelta;
        var cheat = 6; // account for plotlines (white)

        // after the first plotline
        chart.renderer.path(['M', tickPixel0, xaxis_y1, 'L', xaxis_x2, xaxis_y1])
            .attr({
                'id': 'xAxisLight',
                'stroke-width': stroke_width,
                stroke: '#d1d2d4', //'lightgrey',
                'stroke-dasharray': stroke_dasharray
            })
            .add();

        chart.renderer.path(['M', tickPixel0 + tickPixelDelta, xaxis_y1, 'L', xaxis_x2, xaxis_y1])
            .attr({
                'id': 'xAxisDark',
                'stroke-width': stroke_width,
                stroke: '#939597', //'grey'
                'stroke-dasharray': stroke_dasharray
            })
            .add();


        //
        // add styled yaxis
        //
        tickDivisions = 4;
        tickPixel0 = chart.yAxis[0].toPixels(chart.yAxis[0].tickPositions[0]);
        tickPixel1 = chart.yAxis[0].toPixels(chart.yAxis[0].tickPositions[1]);
        tickPixelDelta = (tickPixel0 - tickPixel1) / tickDivisions;
        stroke_dasharray = tickPixelDelta + ',' + tickPixelDelta;
        //console.log(stroke_dasharray);

        var yaxis_x1 = chart.plotBox.x - 5;
        var yaxis_y1 = chart.plotBox.y + chart.plotBox.height;
        var yaxis_y2 = chart.plotBox.y;
        chart.renderer.path(['M', yaxis_x1, yaxis_y1, 'L', yaxis_x1, yaxis_y2])
            .attr({
                'stroke-width': stroke_width,
                stroke: '#d1d2d4', //'lightgrey',
                'stroke-dasharray': stroke_dasharray
            })
            .add();


        chart.renderer.path(['M', yaxis_x1, yaxis_y1 - tickPixelDelta, 'L', yaxis_x1, yaxis_y2])
            .attr({
                'stroke-width': stroke_width,
                stroke: '#939597', //'grey',
                'stroke-dasharray': stroke_dasharray
            })
            .add();

        // paint grey box under, d1d2d4, blue box at origin
        var blue_box_y = xaxis_y1 - 5;


        chart.renderer.path(['M', xaxis_x1, blue_box_y , 'L', xaxis_x1, blue_box_y + stroke_width, 'L', xaxis_x1 - stroke_width, blue_box_y + stroke_width, 'L', xaxis_x1 - stroke_width, blue_box_y, 'Z'])
            .attr({
                fill: 'rgba(209,210,212, 1.0)', // #d1d2d4
                id: 'blueBox1'
            })
            .add();

        chart.renderer.path(['M', xaxis_x1 - 2, blue_box_y + 2 , 'L', xaxis_x1 - 2, blue_box_y + stroke_width, 'L', xaxis_x1 - stroke_width, blue_box_y + stroke_width, 'L', xaxis_x1 - stroke_width, blue_box_y + 2, 'Z'])
            .attr({
                fill: 'rgba(0,151,205, 1.0)',
                id: 'blueBox'
            })
            .add();

        chart.renderer.rect(xaxis_x1 - 2, xaxis_y1 - 5, 2, 2, 0)
            .attr({
                fill: 'rgba(255,255,255, 1.0)', // #d1d2d4
                id: 'whiteRect'
            })
            .add();

    }


    // initialize chart marker
    var p = chart.series[0].points[initialMarkerIndex];
    if (p) {
        p.update({
            marker: {
                enabled: true,
                radius: 7,
                lineColor: 'white',
                lineWidth: 2
            }
        });
        chart.tooltip.refresh(chart.series[0].data[initialMarkerIndex]);
    }

    if (marker) {
        var _data = chart.series[0].data[initialMarkerIndex];
        marker.setPosition(new google.maps.LatLng(_data.lat, _data.lon));
    }
    // initialize
    renderPlotLines(chart);
}

var lastMarkerIndex;

ProfileVisualizer.prototype._addCrossHairs = function (nearestLocation, index, addChartMarker) {
    var _xaxis_y1 = chart.plotBox.y + chart.plotBox.height;
    var crosshair_height = 10;
    var crosshair_width = 20;
    var crosshair_x = chart.xAxis[0].toPixels(nearestLocation.x) - crosshair_width / 2;
// TODO figure out how to make relative relative?
    chart.renderer.path(['M', crosshair_x, _xaxis_y1, 'L', crosshair_x + crosshair_width, _xaxis_y1, 'L', crosshair_x + crosshair_width / 2, _xaxis_y1 + crosshair_height, 'Z'])
        .attr({
            fill: 'rgba(0,151,205,1.0)',
            id: 'xAxisCrossHair'
        })
        .add();

    var _xaxis_x = chart.plotBox.x;
    var crosshair_y = chart.yAxis[0].toPixels(nearestLocation.y) - crosshair_width / 2;
    chart.renderer.path(['M', _xaxis_x, crosshair_y, 'L', _xaxis_x, crosshair_y + crosshair_width, 'L', _xaxis_x - crosshair_height, crosshair_y + crosshair_width / 2, 'Z'])
        .attr({
            fill: 'rgba(0,151,205,1.0)',
            id: 'yAxisCrossHair'
        })
        .add();

    if (addChartMarker) {
        var radius = 7;
        var charterMarkerX = chart.xAxis[0].toPixels(nearestLocation.x);
        var charterMarkerY = chart.yAxis[0].toPixels(nearestLocation.y);
        chart.renderer.circle(charterMarkerX, charterMarkerY, radius)
            .attr({
                fill: 'rgba(0,151,205,1.0)',
                stroke: 'white',
                'stroke-width': 2,
                id: 'chartMarkerCircle',
                zIndex: 400
            })
            .add();

        if (firstMouseOver) {
            var p = chart.series[0].points[initialMarkerIndex];
            if (p) {
                p.update({
                    marker: {
                        enabled: false
                    }
                });
                firstMouseOver = false;
            }
        }
    }

}

ProfileVisualizer.prototype._removeCrossHairs = function () {
    //console.log('_removeCrossHairs');
    $("#xAxisCrossHair").remove();
    $("#yAxisCrossHair").remove();
    $("#chartMarkerCircle").remove();
}
