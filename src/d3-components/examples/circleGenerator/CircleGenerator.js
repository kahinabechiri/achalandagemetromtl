import * as d3 from 'd3';

import Utility from '@/utilities/Utility.js'

export default {
  name: 'CircleGenerator',
  data () {
    return {
      quantity: 1,
      circles: 0
    }
  },
  mounted() {
  },
  methods: {
    createCircles(event) {
      if (!Utility.isInt(this.quantity)) {
        alert('Valeur incorrecte')
        return
      }
      var i = 0
      for (i = 0; i < this.quantity; i++) {
        this.generateRandomCircle()
      }
    },
    generateRandomCircle() {
      var BORDER = 10
      var DIMENSION = 500
      var cx = Math.random() * DIMENSION
      var cy = Math.random() * DIMENSION
      var svg = d3.select('svg')

      svg.append('circle')
        .attr('cx', function() {
          return cx
        })
        .attr('cy', function() {
          return cy
        })
        .attr('r', function() {
          return Math.random() * 10 + 10
        })
        .attr('fill', function() {
          if (cx > cy + BORDER && cx + cy < DIMENSION - BORDER) return 'orange'
          else if (cx > cy + BORDER && cx + cy > DIMENSION + BORDER) return 'blue'
          else if (cx < cy - BORDER && cx + cy < DIMENSION - BORDER) return 'purple'
          else if (cx < cy - BORDER && cx + cy > DIMENSION + BORDER) return 'green'
          else return 'black'
        })
      this.update()
    },
    update() {
      this.circles = d3.selectAll('circle').size()
    },
    deleteCircles() {
      if (this.circles < 1) {
        alert('Aucun circle a supprimer')

        return
      }

      var deleteAllCircles = window.confirm('Souhaitez-vous supprimer tous les circles?')
      d3.selectAll('circle').remove()
      this.update()
    },
  },
}
