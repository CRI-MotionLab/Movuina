<template>
<module :id="id" :direction="direction" :addresses="addresses">
  <!-- adding the "inline" class here makes a smaller white block when window is large enough -->
  <div id="movuino-vibrator-control" class="section-subcontainer">
    <h3> Vibrator </h3>

    <div> Vibration </div>
    <div>
      <button
        class="blue-yellow-squared-toggle"
        id="movuino-interaction-vibrator-on-off"
        v-on:click="() => {
          isConstantlyVibrating = !isConstantlyVibrating;
          onVibroNow();
        }"
        v-bind:class="{ on: isConstantlyVibrating }"
      ></button>
    </div>

    <div> Pulsations </div>
    <div>
      <div class="inline third">
        <div class="subtle"> on </div>
        <div class="subtle">
          <input v-model="pulse.on" type="number" id="movuino-interaction-pulse-on-duration">
        </div>
        <div class="subtle"> ms </div>
      </div>
      <div class="inline third">
        <div class="subtle"> off </div>
        <div class="subtle">
          <input v-model="pulse.off" type="number" id="movuino-interaction-pulse-off-duration">
        </div>
        <div class="subtle"> ms </div>
      </div>
      <div class="inline third">
        <div class="subtle"> repetitions </div>
        <div class="subtle">
          <input v-model="pulse.times" type="number" id="movuino-interaction-pulse-nb-repetitions">
        </div>
        <div class="subtle"> times </div>
      </div>
    </div>

    <div>
      <button
        class="blue-yellow-squared-toggle"
        id="movuino-interaction-pulse-trig-btn"
        v-on:click="onVibroPulse"
      >Pulse</button>
    </div>
  </div>
</module>
</template>

<script>
  import Module from './Module.vue';
  import config from '../../../../config';

  export default {
    components: {
      module: Module,
    },
    data() {
      return {
        id: 'vibrator',
        direction: 'left',
        addresses: [ '/vibro/now', '/vibro/pulse' ],
        isConstantlyVibrating: false,
        pulse: {
          on: 0,
          off: 0,
          times: 0,
        },
        // destination: '',
      };
    },
    created() {
      this.destination = '';
      this.setDestination(this.$store.state.useSerialInput);
      this.$store.watch(this.$store.getters.useSerialInput, (val, oldVal) => {
        this.setDestination(val);
      });
      this.$store.watch(this.$store.getters.inputLocalOscFrame, (val, oldVal) => {
        const message = val[this.id];
        switch (message.address) {
          case '/vibro/now':
            this.isConstantlyVibrating = parseInt(message.args[0].value) > 0;
            this.onVibroNow();
            break;
          case '/vibro/pulse':
            this.pulse = {
              on: message.args[0].value,
              off: message.args[1].value,
              times: message.args[2].value,
            };
            this.onVibroPulse();
            break;
          default:
            break;
        }
      });
    },
    methods: {
      setDestination(serial) {
        this.destination = serial
                         ? 'serial'
                         : `port ${config.movuinoOscServer.remotePort}`;        
      },
      onVibroNow() {
        const message = {
          destination: this.destination,
          address: '/vibro/now',
          args: [
            { type: 'i', value: this.isConstantlyVibrating ? 1 : 0 },
          ],
        };
        this.$store.dispatch('updateOutputDevicesOscFrame', message)
      },
      onVibroPulse() {
        const message = {
          destination: this.destination,
          address: '/vibro/pulse',
          args: [
            { type: 'i', value: parseInt(this.pulse.on) },
            { type: 'i', value: parseInt(this.pulse.off) },
            { type: 'i', value: parseInt(this.pulse.times) },
          ],
        };
        this.$store.dispatch('updateOutputDevicesOscFrame', message)
      },
    },
  };
</script>