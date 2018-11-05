<template>
  <div>
    <lightbox :view="view" :show="show" v-on:lightbox-data="onLightboxData" />
    <div id="main" :class="showOscConnections">
      <devices />
      <modules />
    </div>
  </div>
</template>

<script>
  import LightBox from './LightBox.vue';
  import Devices from './Devices.vue';
  import Modules from './Modules.vue';

  export default {
    components: {
      lightbox: LightBox,
      devices: Devices,
      modules: Modules,
    },
    props: [ 'childReady' ],
    watch: {
      childReady: {
        immediate: true,
        deep: true,
        handler: function(val) {
          if (val) this.init();
        },
      },
    },
    data() {
      return {
        showOscConnections: 'show-osc-connections',
        view: 'drivers',
      };
    },
    mounted() {
      this.$store.watch(this.$store.getters.showOscConnections, (val, oldVal) => {
        this.showOscConnections = val ? 'show-osc-connections' : '';
      });

      this.$store.watch(this.$store.getters.lightboxInfo, (val, oldVal) => {
        this.view = val.view;
        this.show = val.show;
      });
    },
    methods: {
      init() {
        this.$store.dispatch('loaded');
      },
      onLightboxData(data) {
        this.$store.commit('updateLightboxData', data);
        // this.show = false;
      },
    },
  };
</script>
