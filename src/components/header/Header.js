import quickMenu from 'vue-quick-menu';

export default {
  name: 'Header',
  components: {
    quickMenu
  },
  data() {
    return {
      count:4,
      icons:["fa fa-home","fa fa-th","fa fa-map","fa fa-info"],
      list:["/","#/overview","#/multiple-maps","#/about"],
      backgroundColor:'#1716169e',
      color:'#ffffff',
      position:'top-right',
      isOpenNewTab:false
    }
  },
  computed:{
    getCount(){
      return Number(this.count)
    },
    getIsOpenNewTab(){
      return Boolean(this.isOpenNewTab)
    }
  }
}
