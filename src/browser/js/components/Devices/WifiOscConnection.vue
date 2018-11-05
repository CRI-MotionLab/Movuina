<template>
  <div id="movuino-osc-connections" :class="showOscConnections">

    <div id="movuino-osc-flow-representations-container-pre">
      <div id="osc-from-movuino-vertical" class="osc-arrow" :class="showOscConnections"></div>
      <div id="osc-to-movuino-vertical" class="osc-arrow" :class="showOscConnections"></div>
    </div>

    <div id="movuino-osc-flow-representations-container" class="section-container">
      <div id="movuino-osc-flow-representations-contents">
        <div id="movuino-osc-flow-output-messages" class="osc-messages" :class="showOscConnections">
          <pre>{{ inputFrame }}</pre>
        </div>

        <div id="movuino-osc-flow-input-messages" class="osc-messages" :class="showOscConnections">
          <pre>{{ outputFrame }}</pre>
        </div>
      </div>
    </div>

    <div id="movuino-osc-flow-representations-container-post">
      <div id="osc-to-app-vertical" class="osc-arrow" :class="showOscConnections"></div>
      <div id="osc-from-app-vertical" class="osc-arrow" :class="showOscConnections"></div>
    </div>

  </div>
</template>

<script>
  export default {
    data() {
      return {
        showOscConnections: 'show-osc-connections',
        inputFrame: '',
        outputFrame: '',
      };
    },
    mounted() {
      // this.show = 'show-osc-connections';
      this.$store.watch(this.$store.getters.showOscConnections, (val, oldVal) => {
        this.showOscConnections = val ? 'show-osc-connections' : '';
      });

      setInterval(() => {
        const fi = this.$store.state.inputDevicesOscFrame;

        if (fi.origin !== '') {
          let stri = `${fi.origin}\n`;
          stri += `${fi.address} ${fi.name}\n`;
          stri += `${fi.accx.toFixed(3)} ${fi.accy.toFixed(3)} ${fi.accz.toFixed(3)}\n`;
          stri += `${fi.gyrx.toFixed(3)} ${fi.gyry.toFixed(3)} ${fi.gyrz.toFixed(3)}\n`;
          stri += `${fi.magx.toFixed(3)} ${fi.magy.toFixed(3)} ${fi.magz.toFixed(3)}\n`;
          stri += `${fi.btn} ${fi.vib}`;
          this.inputFrame = stri;
        }

        const fo = this.$store.state.outputDevicesOscFrame;

        if (fo.destination !== '') {
          let stro = `${fo.destination}\n`;
          
          stro += `${fo.address}\n`;

          let first = true;
          for (let i in fo.args) {
            if (`${parseInt(i)}` === i) {
              if (first) {
                stro += `${fo.args[i].value}`;
                first = false;
              } else {
                stro += ` ${fo.args[i].value}`;
              }
            }
          }
          this.outputFrame = stro;
        }
      }, 50);
    }
  };
</script>