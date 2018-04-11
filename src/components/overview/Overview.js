import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import legend from 'd3-svg-legend'

import Utility from '@/utilities/Utility.js'

export default {
  name: 'Overview',
  data() {
    return {data: '',
    		data_process: '',
    		popularTimes: '',
    		panelIsHidden: false,
    		square: 5,
			ratio: 0.3,
			w_wrap: 27,
			h_wrap: 24,
			sorter: {
		        "monday": 1,
		        "tuesday": 2,
		        "wednesday": 3,
		        "thursday": 4,
		        "friday": 5,
		        "saturday": 6,
		        "sunday": 7
		      }
    	};
  },
  mounted() {
    this.load_data(this)
  },
  methods: {
    load_data(context) {
      // Unicode conversion. (Need it because D3.json() load unicode, but d3.text() not).
      var convertunicode = function(str) {
        return str.replace(/\\u[\dA-F]{4}/gi, function(match) {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
      };

      // Brute force Flatten with indexes to simplify D3 processing.
      var preprocess = function() {
        context.data_process = [];
        // Not pretty ...
        var i,
          j;
        for (i = 0; i < context.w_wrap; i++) {
          for (j = 0; j < context.h_wrap; j++) {
            if (!!context.data[j][i]) {
              var s = context.popularTimes.filter(function(o) {
                return o.name == convertunicode(context.data[j][i]);
              })[0];

              if (!!s) {
                s["i"] = i;
                s["j"] = j;

                // Sort by days.
                s.populartimes.sort(function sortByDay(a, b) {
                  var day1 = a.name.toLowerCase();
                  var day2 = b.name.toLowerCase();
                  return context.sorter[day1] > context.sorter[day2];
                });

                s["flat_data"] = []
                var elem,
                  elem2;
                for (elem = 0; elem < s.populartimes.length; elem++) {
                  for (elem2 = 0; elem2 < s.populartimes[elem].data.length; elem2++) {
                    s["flat_data"].push({"value": s.populartimes[elem].data[elem2], "i": elem, "j": elem2})
                  }
                }

                context.data_process.push(s);
              }
            }
          }
        }
      };

      d3.text("static/data/metro_matrix.csv", function(d) {
        context.data = d3.csvParseRows(d)

        d3.json("static/data/pt_metro.json", function(d) {
          context.popularTimes = d;
          preprocess();
          context.generateMap(context)
        });
      });
    },
    generateMap(context) {

    	var w = 24 * this.ratio * this.square * this.w_wrap,
			h = 7 * this.square * this.h_wrap,
			colors = d3.scaleLinear().domain([0, 100]).range(["#EEE", "red"]);

		// Tips with name station and lines colour.
		var tip = d3Tip().attr('class', 'd3-tip').offset([-5, 0]).style('color','#FFF').style('background','rgba(0, 0, 0, 0.8)').style('padding', '12px').html(function(d) {
				var l,
					lines = '';
				d.line = Array.isArray(d.line)? d.line: [d.line]; //Solo item are not in an array.
				// Process multiple color stations.
				for(l in d.line){
					lines += "<font color='"+d.line[l]+"'>■</font>";
				}
				return "<strong>"+d.name+"</strong> "+lines;
			});

		// create the svg.
		var svg = d3.select('#grid').append('svg').attr('id', "svg").attr('width', w).attr('height', h).attr('transform', 'translate(0,50)').call(tip);

	    // create group for each subway.
	    var subways = svg.selectAll('g').data(this.data_process).enter().append('g').attr("id", function(d) {return d.name;});

	    // Invisible rectangle to place the tip at the right place over heatmap.
	    subways.append('rect').attr('x', function(d){return 24 * context.ratio * context.square * d.i}).attr('y', function(d){return 7 * context.square * d.j;})
	    .attr('width', 24 * context.ratio * context.square).attr('height', 7 * context.square).style('opacity', 0).on("mouseover", tip.show).on("mouseout", tip.hide);

	    // Append heatmaps.
	    subways.each(function(d) {
	      // Keep some data from d for the heat map.
	      var frame_x = d.i, frame_y = d.j;

	      // Heat map created at the right spot
	      d3.select(this).selectAll('.rect').data(d.flat_data).enter().append('rect').attr('class','rect')
	      .attr('id', function(d) {
	        return 'day-' + (d.i + 1) + ' hour-' + (d.j + 1);
	      }).attr('width', context.ratio * context.square).attr('height', context.square).attr('x', function(d) {
	        return context.ratio * context.square * (d.j + 24 * frame_x);
	      }).attr('y', function(d) {
	        return context.square * (d.i + 7 * frame_y);
	      }).attr('fill', function(d) {
	        return colors(d.value);
	      }).attr('stroke', "#FFF").attr("stroke-width", 0.27).attr("stroke-opacity", 0.7).attr('pointer-events', 'none');

	    });

	    // Legends and axis

	    var svg_legends = d3.select(".legends").append('svg').attr('width', 250).attr('height', 500).attr('transform', 'translate(0,10)');

	    // Heat Map Axis
	    var rect_axis = svg_legends.append('g').attr('class', 'heatmapaxis').attr('transform', 'translate(60,100)'),
			xAxis = d3.axisTop(d3.scaleLinear().range([6,172]).domain([1,24])),
			yAxis = d3.axisLeft(d3.scalePoint().range([15,160]).domain(['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche']));

	    rect_axis.append('text').attr('transform', 'translate(40, -25)').style('font-size','12px').style('fill','white').text('Heure de la journée');
		rect_axis.append("g").attr("class", "x axis").call(xAxis);
		rect_axis.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("dy", "1em").style("text-anchor", "start");

		// Make heat map of first popular time as example for axis.
		rect_axis.selectAll('.rect_legend').data(this.data_process[0].flat_data).enter().append('rect').attr('class','rect_legend')
	      .attr('width', context.ratio * 24)
	      .attr('height', 24)
	      .attr('x', function(d) {
	        return context.ratio * 24 * d.j;
	      }).attr('y', function(d) {
	        return 24 * d.i;
	      }).attr('fill', function(d) {
	        return colors(d.value);
	      }).attr('stroke', "#000").attr("stroke-width", 0.27).attr('transform', 'translate(3,3)');

		// Color Legend

		var svg_legend = svg_legends.append("g").attr("class", "colorscale");
		svg_legend.append("text").text('Achalandage relative (en %)').attr('y', 10).attr('x', 15).style('font-size','12px').style('fill', 'white');
		svg_legend.append("g").attr("class", "legendLinear").attr("transform", "translate(15,15)");
		var legendLinear = legend.legendColor().labelFormat(d3.format(".0f")).shapeWidth(18).cells(11).orient('horizontal').scale(colors);
		svg_legend.select(".legendLinear").call(legendLinear);

		// Put legend and axis text all in white.
		d3.selectAll('.label').style('fill', 'white');
		d3.selectAll('.tick text').style('fill', 'white');

    }
  }
}
