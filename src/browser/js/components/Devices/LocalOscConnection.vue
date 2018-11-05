<template>
  <div class="local-osc-connection" :class="[direction, showOscConnections]">
    <div v-if="direction === 'left'" class="reset">

      <div class="local-osc-flow-representations-container-pre">
        <div class="osc-to-app-horizontal osc-arrow" :class="showOscConnections"></div>
      </div>

      <div class="local-osc-flow-representations-container">
        <div class="local-osc-flow-representations-contents">
          <div :id="id" class="local-osc-flow-input-messages osc-messages" :class="showOscConnections">
            <pre>{{ oscFrame }}</pre>
          </div>
        </div>
      </div>

    </div>
    <div v-else-if="direction === 'right'" class="reset">

      <div class="local-osc-flow-representations-container-pre">
        <div class="osc-from-app-horizontal osc-arrow" :class="showOscConnections"></div>
      </div>

      <div class="local-osc-flow-representations-container">
        <div class="local-osc-flow-representations-contents">
          <div :id="id" class="local-osc-flow-output-messages osc-messages" :class="showOscConnections">
            <pre>{{ oscFrame }}</pre>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  export default {
    props: [ 'id', 'direction', 'addresses' ],
    data() {
      return {
        showOscConnections: 'show-osc-connections',
        oscFrame: '',
      };
    },
    mounted() {
      this.$store.watch(this.$store.getters.showOscConnections, (val, oldVal) => {
        this.showOscConnections = val ? 'show-osc-connections' : '';
      });

      setInterval(() => {
        const frames = this.direction === 'left'
                     ? this.$store.state.inputLocalOscFrame
                     : this.$store.state.outputLocalOscFrame;


        const f = frames[this.id];

        if (f && this.addresses.indexOf(f.address) !== -1) {
          let str = `${this.direction === 'left' ? f.origin : f.destination}\n`;

          if ([ '/movuino', '/streamo' ].indexOf(f.address) !== -1) { // format for long frame message
            str += `${f.address} ${f.args[0].value}\n`;
            str += `${f.args[1].value.toFixed(3)} ${f.args[2].value.toFixed(3)} ${f.args[3].value.toFixed(3)}\n`;
            str += `${f.args[4].value.toFixed(3)} ${f.args[5].value.toFixed(3)} ${f.args[6].value.toFixed(3)}\n`;
            str += `${f.args[7].value.toFixed(3)} ${f.args[8].value.toFixed(3)} ${f.args[9].value.toFixed(3)}\n`;
            str += `${f.args[10].value} ${f.args[11].value}`;
          } else {
            str += `${f.address}\n`;
            let first = true;

            for (let i in f.args) {
              if (`${parseInt(i)}` === i) {
                let v;

                if (f.args[i].type === 'f') {
                  v = `${f.args[i].value.toFixed(2)}`;
                } else {
                  v = `${f.args[i].value}`;
                }

                if (first) {
                  str += `${v}`;
                  first = false;
                } else {
                  str += ` ${v}`;
                }
              }
            }
          }

          this.oscFrame = str;
        }
      }, 50);
    },
  };
</script>
