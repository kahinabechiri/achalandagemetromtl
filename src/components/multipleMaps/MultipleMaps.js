import * as d3 from 'd3';
import * as topojson from 'topojson';
import Legend from '@/d3-components/legend/Legend.vue'

export default {
  components:{
    'legend-view': Legend
  },
  data() {
    return {
      panelIsHidden: false,
      days: [
        { name: "Monday", value: 0},
        { name: "Tuesday", value: 1},
        { name: "Wednesday", value: 2},
        { name: "Thursday", value: 3},
        { name: "Friday", value: 4},
        { name: "Saturday", value: 5},
        { name: "Sunday", value: 6}
      ],
      hours: [
        { name: "00:00 AM", value: 0},
        { name: "01:00 AM", value: 1},
        { name: "02:00 AM", value: 2},
        { name: "03:00 AM", value: 3},
        { name: "04:00 AM", value: 4},
        { name: "05:00 AM", value: 5},
        { name: "06:00 AM", value: 6},
        { name: "07:00 AM", value: 7},
        { name: "08:00 AM", value: 8},
        { name: "09:00 AM", value: 9},
        { name: "10:00 AM", value: 10},
        { name: "11:00 AM", value: 11},
        { name: "00:00 PM", value: 12},
        { name: "01:00 PM", value: 13},
        { name: "02:00 PM", value: 14},
        { name: "03:00 PM", value: 15},
        { name: "04:00 PM", value: 16},
        { name: "05:00 PM", value: 17},
        { name: "06:00 PM", value: 18},
        { name: "07:00 PM", value: 19},
        { name: "08:00 PM", value: 20},
        { name: "09:00 PM", value: 21},
        { name: "10:00 PM", value: 22},
        { name: "11:00 PM", value: 23}
      ],
      day: 0,
      startHour: 7,
      endHour: 18,
      mapWidth: 300,
      mapHeight: 300,
      mtlMapData: [],
      stations: [],
      projection: d3.geoMercator(),
      scaleR: d3.scaleLinear().domain([0, 100]).range([0, 10]),//scale for cercle radius
      color: d3.scaleOrdinal().domain(["Orange", "Green", "Blue", "Yellow"]).range(["orange", "green", "blue", "yellow"]), //Color scale
      zoom: null,
      minZoom: 2,
      maxZoom: 8,
      currentZoom: 2
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      //Read Json Files
      d3.queue()
      	.defer(d3.json, 'static/data/montreal-laval-long-t.json')
      	.defer(d3.json, 'static/data/stations.geojson')
        .defer(d3.json, 'static/data/popularTime.json')
      	.await(this.processData);
    },

    processData(error, mtl, stations, popularTimeData) {
      if(error) {
        throw error;
      }

      //Process Data
      this.mtlMapData = mtl;
      this.stations = stations;

      let popularTimeForStations = this.filterData(popularTimeData, stations.features.map(s => s.properties.place_id));
      this.stations.features = this.stations.features.map(function(d) {
        var s = popularTimeForStations.find(s => s.id  === d.properties.place_id)
        var stationName = d.properties.name;
        d.properties = Object.assign({}, d.properties, s)
        d.properties.name = String(stationName);
        return d;
      })

      this.displayMaps();
    },

    filterData(data, ids) {
      return data.filter(element => ids.findIndex(id => id === element.id) >= 0)
    },

    displayMaps() {
      if(this.startHour <= this.endHour) {
        var h;
        var mapsWrapper = d3.select(".maps-wrapper");
        for(h = this.startHour; h <= this.endHour; h++) {
          var id = "map_" + String(this.startHour + h);
          var wrapper = mapsWrapper.append('svg')
          .attr("class", "map")
          .attr("id", id)
          .attr("width", this.mapWidth)
          .attr("height", this.mapHeight)

            this.createMap(id, this.mapWidth, this.mapHeight, h);
        }
      }
    },

    initializeZoom(width, height, currentHour, svg, g) {
      //console.log(svg)
      var thisComponent = this;

      this.zoom = d3.zoom().scaleExtent([this.minZoom, this.maxZoom])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", function() {
          thisComponent.currentZoom = d3.event.transform.k;
          g.attr("transform", d3.event.transform);
          g.selectAll(".station-data").attr("r", function(d) {
            var dayData = d.properties.populartimes.filter(p => p.name === thisComponent.days[thisComponent.day].name)[0];
               return thisComponent.scaleR(dayData.data[currentHour]) / thisComponent.currentZoom;
          })
        });
        svg.call(this.zoom);
        svg.transition().duration(1000).call(this.zoom.transform, d3.zoomIdentity.translate(-width * this.minZoom / (this.minZoom + 1), -height * this.minZoom / (this.minZoom + 1)).scale(this.minZoom));
    },

    createMap(id, width, height, currentHour) {
      this.createMtlMap(id, width, height, currentHour);
      this.visualizeData(id, currentHour);
    },

    createMtlMap(id, width, height, currentHour) {
      var states = topojson.feature(this.mtlMapData, this.mtlMapData.objects.greaterMtl),
           center = states.features.filter(function(d) {
             return d.properties.center === true;
           })[0];

      var path = d3.geoPath().projection(this.projection);

      this.projection.translate([0, 0]).scale(1);
      var b = path.bounds(this.stations),//path.bounds(states),
          s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
          t = [
            (width - s * (b[1][0] + b[0][0])) / 2,
            (height - s * (b[1][1] + b[0][1])) / 2
          ];
      this.projection.scale(s).translate(t);

      var wrapper = d3.select("#" + id);
      var svg = wrapper.append('svg')
        .attr("class", "svg-map-wrapper")
        .attr("width", width)
        .attr("height", height);

      var g = svg.append("g").style("stroke-width", "1.5px");

      g.append("path")
        .datum(states)
        .attr("class", "feature")
        .attr("d", path)
        .style("fill", "#b3b3b31a");

      //this.initializeZoom(width, height, currentHour, svg, g) ;
    },

    makeClockFace(svg, currentHour) {
      var r = 20,
      width = 65,
      height =65,
      cx = width / 2,
      cy = height / 2,
      margin = 4,
      hourTickLength = Math.round(r * 0.2),
      quarterTickLength = Math.round(r * 0.3);

      var svg = svg.append("svg")
        .attr("class", "clock")
        .attr("width", width)
        .attr("height", height);
      var g = svg.append("g");

      //Hour thick
      g.selectAll('.hour-thick')
    		.data(d3.range(0,12)).enter()
    			.append('line')
    			.attr('class', function(d) {
            if((d % 3) === 0) {
              return 'quarter hour-thick face';
            }
            return 'regular hour-thick face';
          })
          .attr("x1", cx)
          .attr("y1", margin)
          .attr("x2", cx)
          .attr("y2", function(d) {
            if((d % 3) === 0) {
              return margin + quarterTickLength;
            }
            return margin + hourTickLength;
          })
    			.attr('transform',function(d){
    				return "rotate(" + (d * 5) * 6 + "," + cx + "," + cy + ")";
			});

      // Create the centerdot
      var circles = g.selectAll("circle")
        .data([currentHour])
        .enter()
        .append("circle")
        .attr("class", "centerdot")
        .attr("r", 2)
        .attr("cx", cx)
        .attr("cy", cy);

      //Display AM / PM
      var dRect = ["PM", "AM"],
        wRect = 16,
        hRect = 12;

      var gBars = g.selectAll("rect")
        .data(dRect)
        .enter()
        .append("g");

      gBars.append("rect")
        .attr("class", function(d) {
          if(d === "AM"){
            return "am-time";
          }
          return "pm-time";
        })
        .classed("active", function(d) {
          if((currentHour < 12 && d === "AM") || (currentHour >= 12 && d === "PM")){
            return true;
          }
          return false;
        })
        .attr("x", function(d, i) { return cx - i * wRect; })
        .attr("y", function (d) { return cy + hRect /2; })
        .attr("width", wRect)
        .attr("height", hRect)

      gBars.append("text")
      .attr("class", "time-label")
      .attr("x", function(d, i) { return cx - i * wRect + wRect / 5 ; })
      .attr("y", function (d) { return cy +(5 / 4) * hRect; })
      .text(function(d) { return d; });

      //Create the hand
      g.selectAll("line.hand")
        .data([currentHour])
        .enter()
        .append("line")
        .attr("class", "hour hand")
        .attr("x1", cx)
        .attr("y1", function (d) { return cy + Math.round(0.1 * r) })
        .attr("x2", cx)
        .attr("y2", function (d) { return r -  Math.round(0.45 * r)})
        .attr("transform", function(d){
          return "rotate(" + (d % 12) * 30 + "," + cx + "," + cy + ")"
        });

    },

    visualizeData(id, currentHour) {
      var svg = d3.select("#" + id).select("svg");
      //Display clock
      this.makeClockFace(svg, currentHour);

      //Display Data
      var thisComponent = this;
      this.stations.features = this.stations.features.map(d => {
          let projections = thisComponent.projection([d.properties.coordinates.lng, d.properties.coordinates.lat])
          d.properties.x = d.properties.cx = projections[0];
          d.properties.y = d.properties.cy = projections[1];
          return d;
        })

      var g = d3.select("#" + id).select("svg").select("g");
       g.selectAll("station-data").data(this.stations.features).enter().append("circle")
         .attr('class','station-data')
         .attr("r",function(d) {
           var dayData = d.properties.populartimes.filter(p => p.name === thisComponent.days[thisComponent.day].name)[0];
          return thisComponent.scaleR(dayData.data[currentHour]) / thisComponent.currentZoom;
         })
         .attr("transform", function(d) {
           return "translate(" + d.properties.cx + ", " + d.properties.cy + ")";
         })
         .attr("fill", function(d) {
           if (d.properties.lines.length == 1)
             return thisComponent.color(d.properties.lines[0]);
           else {
             return "black";
           }
         })
         .attr("opacity", 0.8)
         /*.on("mouseover", this.showToolTip)
         .on("mouseout", function() {
           d3.select("#tooltip").classed("hidden", true);
         });*/
    },

    dayChanged(event) {
      this.day = event.target.value;
      this.resetMaps();
      this.displayMaps();
    },

    startHourChanged(event) {
      this.startHour = event.target.value;
      this.resetMaps();
      this.displayMaps();
    },

    endHourChanged(event) {
      this.endHour = event.target.value;
      this.resetMaps();
      this.displayMaps();
    },

    resetMaps() {
      var maps = d3.select(".maps-wrapper").selectAll(".map");//.selectAll("svg").select("g").selectAll(".station-data");
      maps.remove();
    }
  }
}
