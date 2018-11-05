<template>
<div>
  <div id="movuino">
    <div id="logo-container" class="section-container">
      <div> <img class="movuino-logo"> </div>
    </div>

    <serial-ports />
    <serial-sensors />
    <settings />
  </div>
  <wifi-osc-connection />
</div>
</template>

<script>
  import SerialPorts from './Devices/SerialPorts.vue';
  import SerialSensors from './Devices/SerialSensors.vue';
  import Settings from './Devices/Settings.vue';
  import WifiOscConnection from './Devices/WifiOscConnection.vue';

  export default {
    components: {
      'serial-ports': SerialPorts,
      'serial-sensors': SerialSensors,
      settings: Settings,
      'wifi-osc-connection': WifiOscConnection,
    },
    methods: {
    },
    // mounted() {
    //   this.$emit('wifi-info');
    // },
  };
</script>