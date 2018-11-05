<template>
<module
  :id="id"
  :direction="direction"
  :addresses="addresses">

  <div class="section-flex">

<!-- /////////////////////////////////////////////////////////////////////// -->

  <!-- <div> -->
    <!-- <div id="data-visualization-controls" class="section-subcontainer inline"> -->
    <div id="data-visualization-controls" class="reset inline">
      <div class="section-subcontainer">
      <h3> Visual render </h3>

      <div>
        <div>
          <div class="subtle"> Zoom </div>
          <!-- see https://github.com/vuejs/vue/issues/3830 : default type of input range is string -->
          <input v-model.number="zoomValue" type="range" min="0" max="1" step="0.01" id="zoom-slider">
        </div>
        <div>
          <div class="subtle"> Render </div>
          <div class="menu-wrapper dark-grey inline reset">
            <select v-model="lineStyle" id="line-style-menu">
              <option value="curve">Curve</option>
              <option value="line">Line</option>
            </select>
          </div>
        </div>
        <div>
          <div class="subtle"> Point </div>
          <div class="menu-wrapper dark-grey inline reset">
            <select v-model="pointStyle" id="point-style-menu">
              <option value="none">None</option>
              <option value="points">Points</option>
            </select>
          </div>
        </div>
        <div>
          <div class="subtle"> Line width </div>
          <input v-model.number="lineWidth" type="range" min="1" max="5" step="0.05" id="line-width-slider">
        </div>
      </div>
      </div>

      <div class="section-subcontainer giant">
      <h3> Modulation </h3>

      <div>
        <div>
          <div class="subtle"> Resampling frequency </div>
          <input
            v-on:input="onResamplingFrequencyChanged($event)"
            v-model.number="resamplingFrequency"
            type="range" min="5" max="50" step="1" id="resampling-frequency-slider">
          <div class="subtle" id="resampling-frequency-value">
            {{ resamplingFrequency }} Hz
          </div>
        </div>
        <div>
          <div class="subtle"> Lowpass filter window size </div>
          <input
            v-on:input="onFilterSizeChanged($event)"
            v-model.number="filterSize"
            type="range" min="1" max="50" step="1" id="filter-size-slider">
          <div class="subtle" id="filter-size-value">
            {{ filterSize }} sample{{ filterSize !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
      </div>
    </div> <!-- data visualization controls -->

<!-- /////////////////////////////////////////////////////////////////////// -->

    <div id="data-visualization-sensors" class="reset inline has-right-arrow">
      <div class="section-subcontainer">
        <h3> Display / Record </h3>

        <div>
          <div id="record-data-container" class="section-flex">

            <div class="buttons">
            <div
              class="button play"
              title="enable / disable sensor input"
              v-on:click="() => { isPlaying = !isPlaying; onPlay(); }"
              v-bind:class="{ play: !isPlaying, pause: isPlaying }"
            ></div>

            <div
              class="button record"
              title="start / stop recording incoming data"
              v-on:click="() => { isRecording = !isRecording; onRecord(); }"
              v-bind:class="{ record: !isRecording, stop: isRecording }"
            ></div>
            </div>

            <div id="record-data-txt-container" class="reset">
              <div id="record-data-txt">
                {{ recordingDuration }}
              </div>
            </div>

            <!-- <div class="inline"> <button id="get-recorded-data-btn">Save as ...</button> </div> -->
          </div>
        </div>
        </div>

        <div class="section-subcontainer giant">
        <h3> Data sensors </h3>

        <div>
          <div class="subtle"> Accelerometer </div>
          <canvas-component>
            <preprocessing-renderer
              :step="this.displaySensorValues.step"
              :name="'movuino-accelerometer-waveform'"
              :x="this.displaySensorValues.accx"
              :y="this.displaySensorValues.accy"
              :z="this.displaySensorValues.accz"
              :zoom="this.zoomValue"
              :lstyle="this.lineStyle"
              :pstyle="this.pointStyle"
              :lwidth="this.lineWidth"
            />
          </canvas-component>
          <div class="inline third">
            X <div class="dimension-label light-yellow inline" id="accel-x-waveform-label">
              {{ displaySensorValues.accx.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Y <div class="dimension-label light-blue" id="accel-y-waveform-label">
              {{ displaySensorValues.accy.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Z <div class="dimension-label light-red" id="accel-z-waveform-label">
              {{ displaySensorValues.accz.toFixed(2) }}
            </div>
          </div>
        </div>

        <div>
          <div class="subtle"> Gyroscope </div>
          <canvas-component>
            <preprocessing-renderer
              :step="this.displaySensorValues.step"
              :name="'movuino-gyroscope-waveform'"
              :x="this.displaySensorValues.gyrx"
              :y="this.displaySensorValues.gyry"
              :z="this.displaySensorValues.gyrz"
              :zoom="this.zoomValue"
              :lstyle="this.lineStyle"
              :pstyle="this.pointStyle"
              :lwidth="this.lineWidth"
            />
          </canvas-component>
          <div class="inline third">
            X <div class="dimension-label light-yellow" id="gyro-x-waveform-label">
              {{ displaySensorValues.gyrx.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Y <div class="dimension-label light-blue" id="gyro-y-waveform-label">
              {{ displaySensorValues.gyry.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Z <div class="dimension-label light-red" id="gyro-z-waveform-label">
              {{ displaySensorValues.gyrz.toFixed(2) }}
            </div>
          </div>
        </div>

        <div>
          <div class="subtle"> Magnetometer </div>
          <canvas-component>
            <preprocessing-renderer
              :step="this.displaySensorValues.step"
              :name="'movuino-magnetometer-waveform'"
              :x="this.displaySensorValues.magx"
              :y="this.displaySensorValues.magy"
              :z="this.displaySensorValues.magz"
              :zoom="this.zoomValue"
              :lstyle="this.lineStyle"
              :pstyle="this.pointStyle"
              :lwidth="this.lineWidth"
            />
          </canvas-component>
          <div class="inline third">
            X <div class="dimension-label light-yellow" id="magneto-x-waveform-label">
              {{ displaySensorValues.magx.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Y <div class="dimension-label light-blue" id="magneto-y-waveform-label">
              {{ displaySensorValues.magy.toFixed(2) }}
            </div>
          </div>
          <div class="inline third">
            Z <div class="dimension-label light-red" id="magneto-z-waveform-label">
              {{ displaySensorValues.magz.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>  <!-- data sensors -->
    </div> <!-- data visualization sensors (including record) -->

<!-- /////////////////////////////////////////////////////////////////////// -->

  </div> <!-- section flex -->
</module>
</template>

<script>
  import Module from './Module.vue';
  import CanvasComponent from '../CanvasComponent.vue';
  import PreprocessingRenderer from './PreprocessingRenderer.vue';
  import Preprocessing from './Preprocessing.js';
  import config from '../../../../config';

  export default {
    components: {
      module: Module,
      'canvas-component': CanvasComponent,
      'preprocessing-renderer': PreprocessingRenderer,
    },
    data() {
      return {
        // vars for module
        id: 'preprocessing',
        direction: 'right',
        addresses: [ '/movuino', '/streamo' ],
        // local vars
        isPlaying: true,
        wasPlaying: false,
        isRecording: false,
        step: false,
        inputSensorValues: {
          accx: 0, accy: 0, accz: 0,
          gyrx: 0, gyry: 0, gyrz: 0,
          magx: 0, magy: 0, magz: 0,
          btn: 0, vib: 0
        },
        preprocessedSensorValues: {
          accx: 0, accy: 0, accz: 0,
          gyrx: 0, gyry: 0, gyrz: 0,
          magx: 0, magy: 0, magz: 0,
          btn: 0, vib: 0
        },
        displaySensorValues: {
          step: false,
          accx: 0, accy: 0, accz: 0,
          gyrx: 0, gyry: 0, gyrz: 0,
          magx: 0, magy: 0, magz: 0,
        },
        resamplingFrequency: 25,
        filterSize: 1,
        recordingDuration: '00:00:00:000',
      };
    },
    mounted() {
      this.onPlay();
    },
    created() {
      this.zoomValue = 0;
      this.lineStyle = 'curve';
      this.pointStyle = 'none';
      this.lineWidth = 1;
      // this.resamplingFrequency = 5;
      // this.filterSize = 30;

      this.lastDate = Date.now();
      this.minDisplayInterval = 40;
      this.recordInterval = null;

      this.preprocessing = new Preprocessing();

      ////////////////////////// on new frame from Preprocessing component :

      this.preprocessing.on('frame', (f) => {
        Object.assign(this.preprocessedSensorValues, this.inputSensorValues, {
          accx: f[0], accy: f[1], accz: f[2],
          gyrx: f[3], gyry: f[4], gyrz: f[5],
          magx: f[6], magy: f[7], magz: f[8],
        });

        const ppf = this.preprocessedSensorValues;

        const message = {};
        message[`${this.id}`] = {
          destination: `port ${config.localOscServer.remotePort}`,
          address: ppf.address,
          args: [
            { type: 's', value: ppf.name },
            { type: 'f', value: ppf.accx },
            { type: 'f', value: ppf.accy },
            { type: 'f', value: ppf.accz },
            { type: 'f', value: ppf.gyrx },
            { type: 'f', value: ppf.gyry },
            { type: 'f', value: ppf.gyrz },
            { type: 'f', value: ppf.magx },
            { type: 'f', value: ppf.magy },
            { type: 'f', value: ppf.magz },
            { type: 'i', value: ppf.btn },
            { type: 'i', value: ppf.vib },
          ],
        };
        this.$store.dispatch('updateOutputLocalOscFrame', message)
        this.$store.commit('updatePreprocessedSensorsOscFrame', ppf);

        const now = Date.now();
        // if (now - this.lastDate > this.minDisplayInterval) {
          this.lastDate = now;
          this.step = !this.step;
          requestAnimationFrame(() => {
            Object.assign(this.displaySensorValues, { step: this.step }, this.preprocessedSensorValues);
          });
        // }        
      });

      ////////////////////////// on new recording from Preprocessing component :

      this.preprocessing.on('recording', (data) => {
        this.$store.dispatch('setLightboxInfo', { view: 'recording', 'show': true })
        .then((formats) => {
          delete formats.all;
          formats.nformats = 0;

          [ 'csv', 'xlsx' ].forEach((f) => { if (formats[f]) formats.nformats++; })

          if (formats.nformats > 0) { // otherwise we don't save anything
            let ext;

            if (formats.nformats > 1) {
              ext = 'zip'
            } else {
              if (formats.xlsx) {
                ext = 'xlsx';
              } else if (formats.csv) {
                ext = 'csv';
              } else {
                ext = 'txt';
              }
            }

            const filename = `Movuino-recording-${Date.now()}`;

            electron.remote.dialog.showSaveDialog({
              defaultPath: `${filename}.${ext}`,
            }, (filepath) => {
              if (filename !== undefined) {
                const rec = { formats, data, filename, filepath };
                this.$store.dispatch('sendRecording', rec);
              }
              this.$store.dispatch('setLightboxInfo', { 'show': false });
            });
          } else {
            this.$store.dispatch('setLightboxInfo', { 'show': false });
          }
        });
      });

      this.$store.watch(this.$store.getters.inputDevicesOscFrame, (f, prevf) => {
        Object.assign(this.inputSensorValues, f);

        if (this.isPlaying) {
          this.preprocessing.process(this.inputSensorValues);          
        }
      });
    },
    methods: {
      onPlay() {
        if (this.isPlaying) {
          this.preprocessing.start();
        } else {
          this.preprocessing.stop();
          this.preprocessing.stopRecording();
          if (this.isRecording) {
            this.isRecording = false;

            if (this.recordInterval !== null) {
              clearInterval(this.recordInterval);
              this.recordInterval = null;
            }
          }
        }
      },
      onRecord() {
        if (this.isRecording) {
          this.preprocessing.startRecording();
          this.wasPlaying = this.isPlaying;
          this.isPlaying = true;
          this.onPlay();

          const now = Date.now();
          let hours;
          let minutes;
          let seconds;
          let ms;

          function formatWithZeroes(num, length) {
            let r = '' + num;
            while (r.length < length) {
              r = '0' + r;
            }
            return r;
          }

          this.recordInterval = setInterval(() => {
            const realNow = Date.now() - now;
            hours = Math.floor(realNow / 3600000) % 24;
            minutes = Math.floor(realNow / 60000) % 60;
            seconds = Math.floor(realNow / 1000) % 60;
            ms = realNow % 1000;
            this.recordingDuration = `
              ${formatWithZeroes(hours, 2)}:${formatWithZeroes(minutes, 2)}:${formatWithZeroes(seconds, 2)}:${formatWithZeroes(ms, 3)}
            `;
          }, 40);
        } else { // !this.isRecording
          this.preprocessing.stopRecording();
          this.isPlaying = this.wasPlaying;
          this.onPlay();

          if (this.recordInterval !== null) {
            clearInterval(this.recordInterval);
            this.recordInterval = null;
          }
        }
      },
      onResamplingFrequencyChanged(e) {
        this.preprocessing.setResamplingFrequency(parseInt(e.target.value));
      },
      onFilterSizeChanged(e) {
        this.preprocessing.setFilterSize(parseInt(e.target.value));
      },
    },
  };
</script>