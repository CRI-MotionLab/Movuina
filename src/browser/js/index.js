// import Vue from 'vue';
import Vue from 'vue/dist/vue.js';
import App from './components/App.vue';
// import VueRouter from 'vue-router';
import store from './store';

// Vue.use(VueRouter);

// entry point found here :
// https://www.raymondcamden.com/2017/12/06/quick-example-of-apache-cordova-and-vuejs

const main = new Vue({
  el: '#main-wrapper',
  store,
  components: {
    'main-component': App
  },
  data: {
    parentReady: false,
  },
  methods: {
    init: function() {
      // when every initialization stuff is done, we set this.parentReady true
      // this is propagated from <main-component :child-ready="parentReady">
      // (in index.html) to App.vue and trigs a call to App's init function
      this.parentReady = true;
    },
  },
});

document.addEventListener('DOMContentLoaded', main.init);
