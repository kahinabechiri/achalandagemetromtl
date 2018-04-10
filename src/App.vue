<template>
  <div id="app">
    <header-view/>
    <router-view/>
    <!--<footer-view/>-->
  </div>
</template>

<script>
import HeaderView from '@/components/header/Header.vue'
import FooterView from '@/components/footer/Footer.vue'

export default {
  name: 'app',
  components: {
    'header-view': HeaderView,
    'footer-view': FooterView
  }
}
</script>

<style lang="less">
  body {
    margin: 0px !important;
  }
</style>
