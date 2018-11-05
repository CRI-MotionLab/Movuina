<template>
  <div :class="'right-arrow-overlay'">
    <slot></slot>
    <local-osc-connection :id="id" :direction="direction" :addresses="addresses"/>
  </div>
</template>

<script>
  import LocalOscConnection from '../Devices/LocalOscConnection.vue';

  export default {
    props: [ 'id', 'direction', 'addresses' ],
    components: {
      'local-osc-connection': LocalOscConnection,
    },
  };
</script>