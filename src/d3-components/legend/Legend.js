import * as d3 from 'd3';

export default {
  name: 'Legend',
  data() {
    return {}
  },
  mounted() {
    this.displayLegend();
  },
  methods: {
    displayLegend() {
      var values = [25, 50, 75, 100];
      var domain = [0, 100];
      var range = [10, 25];

      var width = this.$refs.legend.offsetWidth,
        height = this.$refs.legend.offsetHeight;

      var sqrtScale = d3.scaleSqrt()
        .domain(values)
        .range(range)

      var svg = d3.select(".legend")
        .append("svg")
        .attr("class", "legend-svg")
        .attr("width", width)
        .attr("height", height);

      var g = svg.append('g')
        .attr('class', 'legend-wrap')
        .attr('transform', 'translate(0,' + sqrtScale(d3.max(values)) + ')')

        // append the values for circles
        g.append('g')
            .attr('class', 'values-wrap')
            .selectAll('circle')
            .data(values)
            .enter().append('circle')
            .attr('class', d => 'values values-' + d)
            .attr('r', d => sqrtScale(d))
            .attr('cx', width/3)
            .attr('cy', d => height/2 - sqrtScale(d))
            .style('fill', 'none')
            .style('stroke', "gray")
            .style('stroke-dasharray', ('2,2'))

          // append some lines based on values
          g.append('g')
              .attr('class', 'values-line-wrap')
              .selectAll('.values-labels')
              .data(values)
              .enter().append('line')
              .attr('x1', d => width/3  + sqrtScale(d) / 3)
              .attr('x2', width/3 + sqrtScale(domain[1]) + 30)
              .attr('y1', d => height/2 - 2 * sqrtScale(d))
              .attr('y2', d => height/2 - 2 * sqrtScale(d))
              .style('stroke', "gray")
              .style('stroke-dasharray', ('0.8'))

            // append some labels from values
           g.append('g')
               .attr('class', 'values-labels-wrap')
               .selectAll('.values-labels')
               .data(values)
               .enter().append('text')
               .attr('x', width/3 + sqrtScale(domain[1]) + 60)
               .attr('y', d => (height/2 - 2 * sqrtScale(d)) + 5)
               .attr('shape-rendering', 'crispEdges')
               .style('text-anchor', 'end')
               .style('fill', "gray")
               .style('font-size', "12px")
               .text(d => d + "%")

    }
  }
}
