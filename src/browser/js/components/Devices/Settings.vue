<template>
  <div id="wifi-configuration-container" class="section-container">
    <h1> Wifi configuration </h1>

    <div id="wifi-configuration-network" class="section-subcontainer">
      <div>
        <div class="inline">
          <div> Wifi name (SSID) </div>
          <input v-model="settings.ssid" type="text" id="network-ssid">
        </div>

        <div class="inline">
          <div> Wifi password </div>
          <input v-model="settings.password" type="password" id="network-password">
        </div>
        
        <div>
          <div> IP address of your computer </div>
          <div class="inline reset">
            <input v-model="settings.hostip.ip1" type="number" class="small-number"> .
            <input v-model="settings.hostip.ip2" type="number" class="small-number"> .
            <input v-model="settings.hostip.ip3" type="number" class="small-number"> .
            <input v-model="settings.hostip.ip4" type="number" class="small-number">
          </div>
          
          <div class="inline reset">
            <button v-on:click="getMyIp" id="get-my-ip-btn" class="get-my-ip"> Get my IP </button>
          </div>
        </div>

        <div class="inline">
          <div> Movuino OSC identifier </div>
          <input v-model="settings.name" type="text" id="movuino-osc-identifier">
        </div>
      </div>

      <div id="refresh-movuino-wifi">
        <button v-on:click="sendSettings" id="refresh-movuino-wifi-btn" class="blue-rounded">
          Refresh connection
        </button>
      </div>

      <div id="movuino-wifi-on-off">
        <button id="movuino-connected-circle" class="circle" :class="movuinoConnectedClass"></button>
        <label id="movuino-connected-label" :class="movuinoConnectedClass">
        </label>
      </div>

      <div id="wifi-configuration-movuino-get-ip">
        Movuino IP address :
      </div>

      <div id="wifi-configuration-movuino-ip">
        <input v-model="settings.movuinoip.ip1" type="number" class="small-number" disabled> .
        <input v-model="settings.movuinoip.ip2" type="number" class="small-number" disabled> .
        <input v-model="settings.movuinoip.ip3" type="number" class="small-number" disabled> .
        <input v-model="settings.movuinoip.ip4" type="number" class="small-number" disabled>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        settings: {
          ssid: 'my_network_ssid',
          password: 'my_network_password',
          hostip: { ip1: 0, ip2: 0, ip3: 0, ip4: 0 },
          name: '0',
          movuinoip: { ip1: 0, ip2: 0, ip3: 0, ip4: 0 },
          wifiState: 0,
        },
        movuinoConnectedClass: 'bad',
      };
    },
    mounted() {
      this.$store.watch(this.$store.getters.movuinoSettings, (val, oldVal) => {
        this.settings.ssid = val.ssid;
        this.settings.password = val.password;
        const ipa = val.hostip.split('.');
        this.settings.hostip = { ip1: ipa[0], ip2: ipa[1], ip3: ipa[2], ip4: ipa[3] };
        this.settings.name = val.name;
      });

      this.$store.watch(this.$store.getters.movuinoState, (val, oldVal) => {
        if (val.serialPortReady) {
          const ipa = val.movuinoip.split('.');
          this.settings.movuinoip = { ip1: ipa[0], ip2: ipa[1], ip3: ipa[2], ip4: ipa[3] };
        }
        this.settings.wifiState = val.wifiState;
        this.movuinoConnectedClass = [ 'bad', 'good', 'neutral' ][val.wifiState];
      });
    },
    methods: {
      getMyIp() {
        this.$store.dispatch('getMyIp').then((ip) => {
          if (ip !== null && ip !== undefined) {
            const ipa = ip.split('.');
            this.settings.hostip = { ip1: ipa[0], ip2: ipa[1], ip3: ipa[2], ip4: ipa[3] };
          }
        });
      },
      sendSettings() {
        const hip = this.settings.hostip;
        const settings = {
          ssid: this.settings.ssid,
          password: this.settings.password,
          hostip: `${hip.ip1}.${hip.ip2}.${hip.ip3}.${hip.ip4}`,
          name: this.settings.name,
        };
        this.$store.dispatch('updateMovuinoSettings', settings);
      }
    },
  };
</script>