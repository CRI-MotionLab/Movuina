<template>
  <div class ="section-container">
    <div id="wifi-configuration-movuino" class="section-subcontainer">
      <div id="wifi-configuration-movuino-sensors">
        <div class="inline third">
          <div class="thin">
            <!-- <canvas id="movuino-accelerometers"></canvas> -->
            <!-- <slot name="movuino-accelerometer-bargraph"></slot> -->
            <canvas-component>
              <bargraph-renderer
                :name="'movuino-accelerometer'"
                :x="this.sensorValues.accx"
                :y="this.sensorValues.accy"
                :z="this.sensorValues.accz"
              />
            </canvas-component>
          </div>
          <div class="subtle">Accelerometer</div>
        </div>
        <div class="inline third">
          <div class="thin">
            <!-- <canvas id="movuino-gyroscopes"></canvas> -->
            <!-- <slot name="movuino-gyroscope-bargraph"></slot> -->
            <canvas-component>
              <bargraph-renderer
                :name="'movuino-gyroscope'"
                :x="this.sensorValues.gyrx"
                :y="this.sensorValues.gyry"
                :z="this.sensorValues.gyrz"
              />
            </canvas-component>
          </div>
          <div class="subtle">Gyroscope</div>
        </div>
        <div class="inline third">
          <div class="thin">
            <!-- <canvas id="movuino-magnetometers"></canvas> -->
            <!-- <slot name="movuino-magnetometer-bargraph"></slot> -->
            <canvas-component>
              <bargraph-renderer
                :name="'movuino-magnetometer'"
                :x="this.sensorValues.magx"
                :y="this.sensorValues.magy"
                :z="this.sensorValues.magz"
              />
            </canvas-component>
          </div>
          <div class="subtle">Magnetometer</div>
        </div>
      </div>
    </div>
  </div>  
</template>

<script>
  import CanvasComponent from '../CanvasComponent.vue';
  import BargraphRenderer from './BarGraphRenderer.vue';

  export default {
    components: {
      'canvas-component': CanvasComponent,
      'bargraph-renderer': BargraphRenderer,
    },
    data() {
      return {
        sensorValues: {
          accx: 0, accy: 0, accz: 0,
          gyrx: 0, gyry: 0, gyrz: 0,
          magx: 0, magy: 0, magz: 0,
        },
      };
    },
    mounted() {
      // this.$store.watch(this.$store.getter)
      setInterval(() => {
        // display serial sensor values resampled at 20 Hz
        // console.log(this.$store.state.serialSensorValues);
        this.sensorValues = this.$store.state.serialSensorValues;
      }, 50);
    }
  };
</script>