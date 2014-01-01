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
    var _path;
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
                },
                //x: 0 // left justify
                align: 'low'
            },
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            // remove gridlines
            lineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
                y: 20 // move down to accommodate border
            }
        },
        yAxis: {
            title: {
                text: 'Speed (mph)'
            },
            min: 0,
            lineWidth: 0,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
                x: -15 // move left to accommodate border
            }
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
                var speed = "<b>SPEED: </b>" + parseFloat(this.y).toFixed(2) + " mph";
                var time = "<b>&nbsp;&nbsp;TIME: </b>" + Highcharts.dateFormat('%H:%M:%S', this.x);
                var tooltip = '<div class="myTooltip" style="background-color:' + this.series.color + ';">' + speed + '<br/>' + time + '</div>';
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

                            // clean this up
                            var _xaxis_y1 = chart.plotBox.y + chart.plotBox.height;
                            var crosshair_height = 10;
                            var crosshair_x = chart.xAxis[0].toPixels(this.x) - crosshair_height / 2;
                            // TODO figure out how to make relative relative?
                            chart.renderer.path(['M', crosshair_x, _xaxis_y1, 'L', crosshair_x + crosshair_height, _xaxis_y1, 'L', crosshair_x + crosshair_height / 2, _xaxis_y1 + crosshair_height, 'Z'])
                                .attr({
                                    fill: 'rgba(0,0,255,1.0)',
                                    id: 'xAxisCrossHair'
                                })
                                .add();

                            var _xaxis_x = chart.plotBox.x;
                            var crosshair_y = chart.yAxis[0].toPixels(this.y) - crosshair_height / 2;
                            chart.renderer.path(['M', _xaxis_x, crosshair_y, 'L', _xaxis_x, crosshair_y + crosshair_height, 'L', _xaxis_x - crosshair_height, crosshair_y + crosshair_height / 2, 'Z'])
                                .attr({
                                    fill: 'rgba(0,0,255,1.0)',
                                    id: 'yAxisCrossHair'
                                })
                                .add();

                        },
                        mouseOut: function () {
                            // debug console.log('mouseOut - point');
                            // TODO remove marker?
                            $("#xAxisCrossHair").remove();
                            $("#yAxisCrossHair").remove();
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

    var grey = [
        'rgba(158, 158, 158, 1.0)',
        'rgba(174, 174, 174, 1.0)',
        'rgba(210, 210, 210, 1.0)',
        'rgba(232, 232, 232, 1.0)'
    ];

    // yaxis plotlines and gradient
    var maxTick = chart.yAxis[0].tickPositions[chart.yAxis[0].tickAmount - 1];
    for (var i = 0; i <= 8; i++) {
        var tuple = i / 8;
        var _value = maxTick * (i / 8);
        var _color = 'rgba(255, 255, 255, 0.8)';
        var _width = 2.5;
        if (i % 2) {
            //console.log(i);
            var _color = grey[(i - 1) / 2];
            var _width = 20;
        }
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
        chart.xAxis[0].addPlotLine({
            value: chart.xAxis[0].tickPositions[i],
            width: 2.5,
            color: 'rgba(255, 255, 255, 0.8)',
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

    // cheat for the first segment
    // N.B.!!! This is is drawing right to left
    chart.renderer.path(['M', tickPixel0, xaxis_y1, 'L', xaxis_x1, xaxis_y1])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'lightgrey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();

    chart.renderer.path(['M', tickPixel0 - tickPixelDelta , xaxis_y1, 'L', xaxis_x1, xaxis_y1])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'grey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();


    // after the first plotline
    chart.renderer.path(['M', tickPixel0, xaxis_y1, 'L', xaxis_x2, xaxis_y1])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'grey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();

    chart.renderer.path(['M', tickPixel0 + tickPixelDelta, xaxis_y1, 'L', xaxis_x2, xaxis_y1])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'lightgrey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();


    //
    // add styled yaxis
    //
    tickDivisions = 2;
    tickPixel0 = chart.yAxis[0].toPixels(chart.yAxis[0].tickPositions[0]);
    tickPixel1 = chart.yAxis[0].toPixels(chart.yAxis[0].tickPositions[1]);
    tickPixelDelta = (tickPixel0 - tickPixel1) / tickDivisions;
    stroke_dasharray = tickPixelDelta + ',' + tickPixelDelta;
    console.log(stroke_dasharray);

    var yaxis_x1 = chart.plotBox.x - 5;
    var yaxis_y1 = chart.plotBox.y + chart.plotBox.height;
    var yaxis_y2 = chart.plotBox.y;
    chart.renderer.path(['M', yaxis_x1, yaxis_y1, 'L', yaxis_x1, yaxis_y2])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'lightgrey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();


    chart.renderer.path(['M', yaxis_x1, yaxis_y1 - tickPixelDelta, 'L', yaxis_x1, yaxis_y2])
        .attr({
            'stroke-width': stroke_width,
            stroke: 'grey',
            'stroke-dasharray': stroke_dasharray
        })
        .add();


}
