import * as d3 from 'd3';
import * as d3Slider from '@/d3-components/slider/slider.js';
import * as _ from 'underscore';
import * as topojson from 'topojson';
import Legend from '@/d3-components/legend/Legend.vue'

export default {
  name: 'Home',
  components:{
    'legend-view': Legend
  },
  data() {
    return {
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
      animationState: 1, //Init = 1, Play = 2, Pause = 3
      startDay: 0,
      startHour: 0,
      endDay: 6,
      endHour: 23,
      minSpeedMultiplier: 0.5,
      maxSpeedMultiplier: 3,
      currentSpeedMultiplier: 1,
      currentSpeed: 1000,
      currentDay: 0,
      currentHour: 0,
      timer: '',
      panelIsHidden: false,
      mtlMapData: [],
      initializePopularTimesCercles: false,
      stations: [],
      // sPopularTime: [],
      zoom: null,
      handle: null,
      mySlider: null,
      minZoom: 2,
      maxZoom: 8,
      currentZoom: 2,
      stationRadius: 3,
      projection: d3.geoMercator(),
      scaleR: d3.scaleLinear().domain([0, 100]).range([5, 40]),//scale for cercle radius
      color: d3.scaleOrdinal().domain(["Orange", "Green", "Blue", "Yellow"]).range(["orange", "green", "blue", "yellow"])//Color scale
    }
  },
  mounted() {
    this.init();
  },
  filters: {
    fixedDecimal(value) {
       if (!value) return ''
       return (+value).toFixed(2)
    }
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

      let popularTimeForStations = this.filterData(popularTimeData, stations.features.map(s => s.properties.place_id))
      stations.features = stations.features.map(function(d) {
        let s = popularTimeForStations.find(s => s.id  === d.properties.place_id)
        let stationName = d.properties.name;
        d.properties = Object.assign({}, d.properties, s)
        d.properties.name = String(stationName);
        return d;
      })

      // Création du path pour centrer sur les stations de métros
      let states = topojson.feature(this.mtlMapData, this.mtlMapData.objects.greaterMtl),
        center = states.features.filter(function(d) {
          return d.properties.center === true;
        })[0];

      let width = this.$refs.mapWrapper.offsetWidth;
      let height = this.$refs.mapWrapper.offsetHeight;
      let path = d3.geoPath().projection(this.projection);
      this.projection.translate([0, 0]).scale(1);
      let b = path.bounds(states),
          s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
          t = [
            (width - s * (b[1][0] + b[0][0])) / 2,
            (height - s * (b[1][1] + b[0][1])) / 2
          ];
      this.projection.scale(s).translate(t);

      //Display Montreal map
      this.displayMtlMap(path);

      //Display Mtl subway stations
      this.displayMtlSubwayStations(stations);;
    },

    displayMtlMap(path) {
      //Save the context
      let thisComponent = this;

      let width = this.$refs.mapWrapper.offsetWidth;
      let height = this.$refs.mapWrapper.offsetHeight;

       //Create SVG and Group
       let svg = d3.select(".map-wrapper").append("svg").attr("width", "100%").attr("height", "100%");
       let g = svg.append("g").style("stroke-width", "1.5px");

       //Implement zoom
       this.zoom = d3.zoom().scaleExtent([this.minZoom, this.maxZoom])
         .translateExtent([[0, 0], [width, height]])
         .on("zoom", function() {
           thisComponent.currentZoom = d3.event.transform.k;
           g.attr("transform", d3.event.transform);

           thisComponent.updateStationsByTime(self.currentSpeed)

           g.selectAll(".station").attr("r", function(d){
             return thisComponent.stationRadius  / thisComponent.currentZoom;
           });
         });
         svg.call(this.zoom);
         svg.transition().duration(1000).call(this.zoom.transform, d3.zoomIdentity.translate(-width * this.minZoom / (this.minZoom + 1), -height * this.minZoom / (this.minZoom + 1)).scale(this.minZoom));

         let states = topojson.feature(this.mtlMapData, this.mtlMapData.objects.greaterMtl),
           center = states.features.filter(function(d) {
             return d.properties.center === true;
           })[0];

        g.append("path").datum(states).attr("class", "feature").attr("d", path).style("fill", "#b3b3b31a");

      this.createSlider(svg, width, height)
    },

    createSlider(svg, width, height) {
      let self = this;

      self.mySlider = d3Slider.sliderHorizontal()
        .min(0)
        .max(self.days.length * 24 - 1)
        .displayValue(false)
        .step(1)
        .width(750)
        .ticks(self.days.length * 24 - 1)
        .tickFormat(function(d) {
          return self.days[Math.floor(d / 24)].name;
        })

      let slider = svg.append("g").call(self.mySlider)

      slider.selectAll(".tick")
        .select("line")
        .attr("y2", function(d) {
          if (d % 24 === 0) {
            return 18;
          } else if (d % 12 === 0) {
            return 12;
          } else {
            return 6;
          }
        })

      slider
        .selectAll(".tick")
        .select("text")
        .attr("opacity", function(d, i) {
          return i % 24 === 0 ? 1 : 0;
        })
        .attr("fill", function(d, i) {
          return i === 0 ? "#000" : "#aaa";
        })

      self.mySlider
        .on('onchange', d => {
          slider
            .selectAll(".tick")
            .select("text")
            .attr("fill", function(d2, i) {
              return (i % 24 === 0 && Math.floor(i / 24) === Math.floor(d / 24)) ? "#000" : "#aaa";
            });
        });

      self.mySlider
        .on('drag', d => {
          slider
            .selectAll(".tick")
            .select("text")
            .attr("fill", function(d2, i) {
              return (i % 24 === 0 && Math.floor(i / 24) === Math.floor(d / 24)) ? "#000" : "#aaa";
            });

          self.currentDay = Math.floor(d / 24);
          self.currentHour = Math.floor(d % 24);
          self.startDay = self.currentDay;
          self.startHour = self.currentHour;

          if (self.animationState == 2) {
            self.pauseEvent();
          }
        })

      let bb = d3.select(".slider").node().getBBox();
      slider.attr("transform", "translate(" + ((width - bb.width) / 2) + "," + 50 + ")")
    },

    updateStationsByTime(transitionDuration) {
      let self = this;
      let cercles = d3.select(".map-wrapper").select("svg").select("g").selectAll(".station-data")
      cercles.transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          let dayData = d.properties.populartimes.filter(p => p.name === self.days[self.currentDay].name)[0];
          return self.scaleR(dayData.data[self.currentHour]) / self.currentZoom;
        })
    },

    displayMtlSubwayStations(stations) {
      let thisComponent = this;
      stations.features = stations.features.map(d => {
          let projections = thisComponent.projection([d.properties.coordinates.lng, d.properties.coordinates.lat])
          d.properties.x = d.properties.cx = projections[0];
          d.properties.y = d.properties.cy = projections[1];
          return d;
        })

      // // Code alternatif qui utilise les path ou lieu de circle.
      // // Fonctionne, mais pas avec l'animation (lorsqu'on peut met à jour le rayon)
      // let path = d3.geoPath().projection(this.projection)
      //   .pointRadius(function(d) { return thisComponent.stationRadius / thisComponent.currentZoom; });
      // let g = d3.select(".map-wrapper").select("svg").select("g");
      // g.selectAll(".station")
      //  .data(stations.features)
      //  .enter()
      //  .append("path")
      //  .attr("d", path)
      //  .attr("class", "station")
      //  // .attr("r", function(d) {
      //  //   return 15; thisComponent.stationRadius / thisComponent.currentZoom;
      //  // })
      //  .attr("fill", function(d) {
      //    if (d.properties.lines.length == 1)
      //      return thisComponent.color(d.properties.lines[0]);
      //    else {
      //      return "black";
      //    }
      //  })
      //  .attr("opacity", 0.75)

      let g = d3.select(".map-wrapper").select("svg").select("g");
      g.selectAll(".station").data(stations.features).enter().append("circle")
        .attr('class','station')
        .attr("r",function(d) {
          return  thisComponent.stationRadius / thisComponent.currentZoom;
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
        .attr("opacity", 0.75);
    },

    displayCercle(stations) {
      let thisComponent = this;
      stations.features = stations.features.map(d => {
          let projections = thisComponent.projection([d.properties.coordinates.lng, d.properties.coordinates.lat])
          d.properties.x = d.properties.cx = projections[0];
          d.properties.y = d.properties.cy = projections[1];
          return d;
        })

      // Code idéal pour utiliser des path au lieu de cercle, mais fonctionne pas.
      // let path = d3.geoPath().projection(this.projection)
      //   .pointRadius(function(d) { return thisComponent.stationRadius / thisComponent.currentZoom; });
      // let g = d3.select(".map-wrapper").select("svg").select("g");
      // g.selectAll("station-data").data(stations.features).enter().append("path").attr("d", path)
      //   .attr('class','station-data')
      //   .attr("fill", function(d) {
      //     if (d.properties.lines.length == 1)
      //       return thisComponent.color(d.properties.lines[0]);
      //       else {
      //         return "black";
      //       }
      //   })
      //   .attr("opacity", 0.15);

      let g = d3.select(".map-wrapper").select("svg").select("g");
      g.selectAll("station-data").data(stations.features).enter().append("circle")
        .attr('class','station-data')
        .attr("r",function(d) {
          return  thisComponent.stationRadius / thisComponent.currentZoom;
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
        .attr("opacity", 0.15)
        .on("mouseover", this.showToolTip)
        .on("mouseout", function() {
          d3.select("#tooltip").classed("hidden", true);
        });
    },

    showToolTip(d) {
      let thisComponent = this;
      let dayData = d.properties.populartimes.filter(p => p.name === thisComponent.days[thisComponent.currentDay].name)[0];

      d3.select("#tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .html(function() {
          let color = "black";
          if (d.properties.lines.length == 1) {
            color = thisComponent.color(d.properties.lines[0]);
          }
          return '<span> <span style="color:' + color + '"> &#9673; </span> <span><strong>' + d.properties.name + ': </strong>' + dayData.data[thisComponent.currentHour]  + '%</span></span>';
        })

      d3.select("#tooltip").classed("hidden", false);
    },

    removeCercles() {
      let cercles = d3.select(".map-wrapper").select("svg").select("g").selectAll(".station-data");
      cercles.remove();
    },

    animate() {
      let thisComponent = this;
      let duration = thisComponent.currentSpeed;//Same as timer ????
      let cercles = d3.select(".map-wrapper").select("svg").select("g").selectAll(".station-data")

      thisComponent.updateStationsByTime(thisComponent.currentSpeed);
      thisComponent.mySlider.value(thisComponent.currentDay * 24 + thisComponent.currentHour);

      this.timer = setInterval(function() {
        let nextDay = thisComponent.currentHour + 1 >= 24 ? thisComponent.currentDay + 1 : thisComponent.currentDay;
        let nextHour = thisComponent.currentHour + 1 >= 24 ? 0 : thisComponent.currentHour + 1;

        if (nextDay > thisComponent.endDay) {
          clearInterval(thisComponent.timer);
        }
        else if (nextDay === thisComponent.endDay && nextHour > thisComponent.endHour) {
          clearInterval(thisComponent.timer);
        }
        else {
          thisComponent.currentDay = nextDay;
          thisComponent.currentHour = nextHour;
        }

        thisComponent.updateStationsByTime(thisComponent.currentSpeed);
        thisComponent.mySlider.value(thisComponent.currentDay * 24 + thisComponent.currentHour);

      }, thisComponent.currentSpeed);
    },

    zoomIn() {
      let svg = d3.select(".map-wrapper").select("svg").transition().duration(350);
      if(this.currentZoom < this.maxZoom) {
        this.currentZoom  = this.currentZoom * 1.5;
        this.zoom.scaleTo(svg, this.currentZoom)
      }
    },

    zoomOut() {
      let svg = d3.select(".map-wrapper").select("svg").transition().duration(350);
      if (this.currentZoom > this.minZoom) {
        this.currentZoom  = this.currentZoom / 1.5;
        this.zoom.scaleTo(svg, this.currentZoom)
      }
    },

    filterData(data, ids) {
      return data.filter(element => ids.findIndex(id => id === element.id) >= 0)
    },

    //Event methods
    stopEvent(event) {
      this.animationState = 1;
      this.currentDay = this.startDay;
      this.currentHour = this.startHour;
      this.initializePopularTimesCercles = false;
      clearInterval(this.timer);
      this.removeCercles();
      this.mySlider.value(this.currentDay * 24 + this.currentHour);
    },

    pauseEvent(event) {
      this.animationState = 3;
      clearInterval(this.timer);
    },

    backwardEvent(event) {
      if(this.currentSpeedMultiplier > this.minSpeedMultiplier) {
        this.currentSpeedMultiplier = +this.currentSpeedMultiplier - 0.25;
        this.currentSpeed = parseInt(1000 / this.currentSpeedMultiplier);
      }
      if(this.animationState  === 2){
        clearInterval(this.timer);
        this.animate();
      }
    },

    playEvent(event) {
      this.animationState = 2;
      if(!this.initializePopularTimesCercles) {
        this.initializePopularTimesCercles = true;
        this.displayCercle(this.stations);
      }
      this.animate();
    },

    forwardEvent(event) {
      if(this.currentSpeedMultiplier < this.maxSpeedMultiplier) {
        this.currentSpeedMultiplier = +this.currentSpeedMultiplier + 0.25;
        this.currentSpeed = parseInt(1000 / this.currentSpeedMultiplier);
      }

      if(this.animationState === 2){
        clearInterval(this.timer);
        this.animate();
      }
    },

    startDayChanged(event) {
      this.currentDay = +event.target.value;
      this.mySlider.value(this.currentDay * 24 + this.currentHour);
    },

    startHourChanged(event) {
      this.currentHour = +event.target.value;
      this.mySlider.value(this.currentDay * 24 + this.currentHour);
    },

    endDayChanged(event) {
    },

    endHourChanged(event) {
    }
  }
}
