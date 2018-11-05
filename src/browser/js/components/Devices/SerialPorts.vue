<template>
  <div id="serialports-container" class="section-container reset">
    <div> <img class="usb-logo"> </div>

    <div>
      <h2> Serial connection (USB) </h2>
    </div>

    <div id="serialports-menu-container">
      <div>
        <div class="menu-wrapper dark-blue inline reset">
          <select id="serialports-menu" v-on:change="onPortChanged" v-model="selected">
            <option :value="null">
              Available ports
            </option>
            <option v-for="option in ports" :value="option" v-model="ports">
              {{ option.split('/dev/tty.').join('') }}
            </option>
          </select>
        </div>

        <label id="movuino-found-label" :class="movuinoConnectedClass">
        </label>
      </div>
    </div>

    <div class="reset">
      <div class="inline">
        <input type="checkbox" v-on:change="onUseSerialChanged" v-model="useSerial">
        <label class="white-font">
          use serial for OSC communication
        </label>
      </div>
    </div>
  </div>  
</template>

<script>
  export default {
    data() {
      return {
        ports: [],
        selected: 'Available ports',
        movuinoConnectedClass: 'bad',
        useSerial: false
      };
    },
    methods: {
      onPortChanged() {
        this.$store.dispatch('updateSerialPort', this.selected);
      },
      onUseSerialChanged() {
        console.log(this.useSerial);
        this.$store.dispatch('updateUseSerialInput', this.useSerial);
      },
    },
    mounted() {
      this.$store.watch(this.$store.getters.movuinoState, (val, oldVal) => {
        console.log(val.serialPortReady);
        this.movuinoConnectedClass = val.serialPortReady ? 'good' : 'bad';
      });

      this.$store.watch(this.$store.getters.serialPorts, (val, oldVal) => {
        const prevSelected = this.selected;
        this.ports = [];
        const ports = this.$store.state.serialPorts
        for (let p in ports) {
          this.ports.push(ports[p]);
        }

        let here = false;
        for (let i in this.ports) {
          if (this.ports[i] === prevSelected) {
            here = true;
            break;
          }
        }

        if (!here) {
          this.selected = null;
          this.onPortChanged();
          // maybe switch to "Movuino not connected" state now
        }
      });
    },
  };
</script>