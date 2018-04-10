import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/home/Home.vue'
import MultipleMaps from '@/components/multipleMaps/MultipleMaps.vue'
import Overview from '@/components/overview/Overview.vue'
import About from '@/components/about/About.vue'

import CircleGenerator from '@/d3-components/examples/circleGenerator/CircleGenerator.vue'
import LineChart from '@/d3-components/examples/LineChart/LineChart.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/multiple-maps',
      name: 'MultipleMaps',
      component: MultipleMaps
    },
    {
      path: '/overview',
      name: 'Overview',
      component: Overview
    },
    {
      path: '/about',
      name: 'About',
      component: About
    },
    {
      path: '/circlegenerator',
      name: 'CircleGenerator',
      component: CircleGenerator
    },
    {
      path: '/linechart',
      name: 'LineChart',
      component: LineChart
    }
  ]
})
