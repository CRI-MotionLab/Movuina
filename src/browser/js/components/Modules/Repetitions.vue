<template>
<module
  :id="id"
  :direction="direction"
  :addresses="addresses">

  <div id="repetitions" class="section-subcontainer">
    <h3> Step detection </h3>
    <div id="sensor-repetitions">

      <div id="movuino-accelerometer-repetitions" class="inline third">
        <div class="thin">
          <canvas-component>
            <repetitions-renderer
              :name="'movuino-accelerometer-repetitions'"
              :value="this.acc.value"
              :threshold="this.acc.threshold"
              :min="this.acc.min"
              :max="this.acc.max"
              :color="this.acc.color"
            />
          </canvas-component>
          <div id="movuino-accelerometer-repetitions-btn" class="sensor-repetitions reset yellow" :class="this.acc.show">
            <div></div>
          </div>
        </div>
        <div class="subtle"> Accelerometer </div>
      </div>

      <div id="movuino-gyroscope-repetitions" class="inline third">
        <div class="thin">
          <canvas-component>
            <repetitions-renderer
              :name="'movuino-gyroscope-repetitions'"
              :value="this.gyr.value"
              :threshold="this.gyr.threshold"
              :min="this.gyr.min"
              :max="this.gyr.max"
              :color="this.gyr.color"
            />
          </canvas-component>
          <div id="movuino-gyroscope-repetitions-btn" class="sensor-repetitions reset blue" :class="this.gyr.show">
            <div></div>
          </div>
        </div>
        <div class="subtle"> Gyroscope </div>
      </div>

      <div id="movuino-magnetometer-repetitions" class="inline third">
        <div class="thin">
          <canvas-component>
            <repetitions-renderer
              :name="'movuino-magnetometer-repetitions'"
              :value="this.mag.value"
              :threshold="this.mag.threshold"
              :min="this.mag.min"
              :max="this.mag.max"
              :color="this.mag.color"
            />
          </canvas-component>
          <div id="movuino-magnetometer-repetitions-btn" class="sensor-repetitions reset red" :class="this.mag.show">
            <div></div>
          </div>
        </div>
        <div class="subtle"> Magnetometer </div>
      </div>

    </div>
  </div> <!-- repetitions -->
</module>
</template>

<script>
  import Module from './Module.vue';
  import CanvasComponent from '../CanvasComponent.vue';
  import RepetitionsRenderer from './RepetitionsRenderer.vue';
  import Repetitions from './Repetitions.js';
  import config from '../../../../config';

  const lightYellow = '#fff17a';
  const lightBlue = '#7cdde2';
  const lightRed = '#f45a54';

  export default {
    components: {
      module: Module,
      'canvas-component': CanvasComponent,
      'repetitions-renderer': RepetitionsRenderer,
    },
    data() {
      return {
        id: 'repetitions',
        direction: 'right',
        addresses: [ '/repetitions' ],
        acc: {
          value: 0,
          threshold: 0,
          min: 0,
          max: 0,
          trig: 0,
          color: lightYellow,
          show: '',
          name: 'accelerometer',
        },
        gyr: {
          value: 0,
          threshold: 0,
          min: 0,
          max: 0,
          trig: 0,
          color: lightBlue,
          show: '',
          name: 'gyroscope',
        },
        mag: {
          value: 0,
          threshold: 0,
          min: 0,
          max: 0,
          trig: 0,
          color: lightRed,
          show: '',
          name: 'magnetometer',
        },
      };
    },
    created() {
      this.accRepetitions = new Repetitions();
      this.gyrRepetitions = new Repetitions();
      this.magRepetitions = new Repetitions();

      this.$store.watch(this.$store.getters.preprocessedSensorsOscFrame, (val, oldVal) => {
        const f = val;
        Object.assign(this.acc, this.accRepetitions.process([ f.accx, f.accy, f.accz ]));
        Object.assign(this.gyr, this.gyrRepetitions.process([ f.gyrx, f.gyry, f.gyrz ]));
        Object.assign(this.mag, this.magRepetitions.process([ f.magx, f.magy, f.magz ]));

        [ this.acc, this.gyr, this.mag ].forEach((item) => {
          if (item.trig === 1) {
            this.blink(item);

            const message = {};
            message[`${this.id}`] = {
              destination: `port ${config.localOscServer.remotePort}`,
              address: this.addresses[0],
              args: [
                { type: 's', value: item.name },
              ],
            };
            this.$store.dispatch('updateOutputLocalOscFrame', message)
          }
        });
      });
    },
    methods: {
      blink(who) {
        who.show = 'on';
        setTimeout(() => {
          who.show = '';
        }, 100);
      }
    }
  };
</script>