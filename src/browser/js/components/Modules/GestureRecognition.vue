<template>
<module
  :id="id"
  :direction="direction"
  :addresses="addresses">

  <div id="xmm" class="section-subcontainer">
    <h3> Gesture recognition </h3>

    <div id=gesture-rec-container>

      <div id="gesture-rec-btns">
        <button
          id="gesture-1-rec-btn"
          class="gesture-rec-btn"
          :class="this.recBtnClasses[0]"
          v-on:click="() => { onClickRec(0); }"
        />
        <button
          id="gesture-2-rec-btn"
          class="gesture-rec-btn"
          :class="this.recBtnClasses[1]"
          v-on:click="() => { onClickRec(1); }"
        />
        <button
          id="gesture-3-rec-btn"
          class="gesture-rec-btn"
          :class="this.recBtnClasses[2]"
          v-on:click="() => { onClickRec(2); }"
        />
      </div> <!-- gesture-rec-btns -->

      <div id="gesture-rec-display" class="reset">
        <!-- <canvas id="gesture-rec-display-canvas"></canvas> -->
        <canvas-component>
          <gesture-recorder
            :reset="reset"
            :x="frame[0]"
            :y="frame[1]"
            :z="frame[2]"
          />
        </canvas-component>
      </div>

      <div>
        <button id="gesture-clear-btn" v-on:click="onClickClear">Clear all gestures</button>
      </div>

      <div id="gesture-1-follow-display" class="gesture-follow-display reset">
        <div id="gesture-1-follow-display-label" class="gesture-follow-display-label inline reset"> 1 </div>
        <div id="gesture-1-follow-display-percent" class="gesture-follow-display-percent inline reset">
          {{ parseInt(percents[0] * 100) + ' %' }}
        </div>
        <!-- <canvas id="gesture-1-follow-canvas"></canvas> -->
        <canvas-component>
          <gesture-follower :focus="focus === 0" :value="percents[0]" :color="colors[0]"/>
        </canvas-component>
      </div>

      <div id="gesture-2-follow-display" class="gesture-follow-display reset">
        <div id="gesture-2-follow-display-label" class="gesture-follow-display-label inline reset"> 2 </div>
        <div id="gesture-2-follow-display-percent" class="gesture-follow-display-percent inline reset">
          {{ parseInt(percents[1] * 100) + ' %' }}
        </div>
        <!-- <canvas id="gesture-2-follow-canvas"></canvas> -->
        <canvas-component>
          <gesture-follower :focus="focus === 1" :value="percents[1]" :color="colors[1]"/>
        </canvas-component>
      </div>

      <div id="gesture-3-follow-display" class="gesture-follow-display reset">
        <div id="gesture-3-follow-display-label" class="gesture-follow-display-label inline reset"> 3 </div>
        <div id="gesture-3-follow-display-percent" class="gesture-follow-display-percent inline reset">
          {{ parseInt(percents[2] * 100) + ' %' }}
        </div>
        <!-- <canvas id="gesture-3-follow-canvas"></canvas> -->
        <canvas-component>
          <gesture-follower :focus="focus === 2" :value="percents[2]" :color="colors[2]"/>
        </canvas-component>
      </div>

    </div> <!-- gesture-rec-container -->
  </div>
</module>
</template>

<script>
  import Module from './Module.vue';
  import CanvasComponent from '../CanvasComponent.vue';
  import GestureRecorderRenderer from './GestureRecorderRenderer.vue'
  import GestureFollowerRenderer from './GestureFollowerRenderer.vue'

  import * as lfo from 'waves-lfo/common';
  import EventIn from '../../lfos/EventIn';
  import Intensity from '../../lfos/Intensity';
  import StillAutoTrigger from '../../lfos/StillAutoTrigger';
  import GestureRecognition from '../../lfos/GestureRecognition';

  import config from '../../../../config';

  const lightYellow = '#fff17a';
  const lightBlue = '#7cdde2';
  const lightRed = '#f45a54';

  export default {
    components: {
      module: Module,
      'canvas-component': CanvasComponent,
      'gesture-recorder': GestureRecorderRenderer,
      'gesture-follower': GestureFollowerRenderer,
    },
    data() {
      return {
        id: 'gesture-recognition',
        direction: 'right',
        addresses: [ '/gesture' ],
        reset: false,
        recBtnClasses: [ '', '', '' ],
        frame: [ 0, 0, 0 ],
        percents: [ 0, 0, 0 ],
        focus: -1,
        colors: [ lightYellow, lightBlue, lightRed ],
      };
    },
    created() {
      this.eventIn = new EventIn({
        frameSize: 3,
        frameType: 'vector',
        frameRate: 1,
      });
      this.intensity = new Intensity({
        feedback: 0.7,
        gain: 0.5,
      });
      this.intensitySelect = new lfo.operator.Select({ index: 0 });
      this.intensityMultiplier = new lfo.operator.Multiplier({ factor: 1000 });
      this.stillAutoTrigger = new StillAutoTrigger({
        onThreshold: 0.2, offThreshold: 0.02, offDelay: 0.1,
      });
      this.stillAutoTriggerBridge = new lfo.sink.Bridge({
        processFrame: (frame) => { this.stillAutoTriggerBridgeCallback(frame) },
      });

      this.gestureRecognitionOnOff = new lfo.operator.OnOff({ state: 'off' });
      this.gestureRecordingBridge = new lfo.sink.Bridge({
        processFrame: (frame) => { this.gestureRecordingBridgeCallback(frame); },
      })
      this.gestureRecognition = new GestureRecognition(this.onTrainingSetChanged);
      this.gestureRecognitionBridge = new lfo.sink.Bridge({
        processFrame: (frame) => { this.gestureRecognitionBridgeCallback(frame); },
      });

      this.eventIn.connect(this.intensity);
      this.intensity.connect(this.intensitySelect);
      this.intensitySelect.connect(this.intensityMultiplier);
      this.intensityMultiplier.connect(this.stillAutoTrigger);
      this.stillAutoTrigger.connect(this.stillAutoTriggerBridge);

      this.eventIn.connect(this.gestureRecognitionOnOff);
      this.gestureRecognitionOnOff.connect(this.gestureRecordingBridge);
      this.gestureRecognitionOnOff.connect(this.gestureRecognition);
      this.gestureRecognition.connect(this.gestureRecognitionBridge);


      this.$store.watch(this.$store.getters.preprocessedSensorsOscFrame, (val, oldVal) => {
        const f = [ val.accx, val.accy, val.accz ];
        this.eventIn.process(null, f);
      });

      this.gestureIndex = null;
      this.eventIn.start();
    },
    methods: {
      onClickRec(index) {
        for (let i = 0; i < 3; i++) {
          if (i !== index) {
            this.recBtnClasses[i] = '';
            this.onRecBtnClassesChanged(i);
          }
        }

        if (this.recBtnClasses[index] === 'armed' ||
            this.recBtnClasses[index] === 'recording') {
          this.recBtnClasses[index] = '';
          this.onRecBtnClassesChanged(index);
        } else {
          this.recBtnClasses[index] = 'armed';
          this.onRecBtnClassesChanged(index);
        }
      },
      onClickClear() {
        this.gestureRecognition.clear();
      },
      onRecBtnClassesChanged(index) {
        this.recBtnClasses = this.recBtnClasses.slice(0);

        if (this.recBtnClasses[index] === '') {
          this.gestureRecognition.stopRecording();
          this.gestureIndex = null;
        } else {
          this.gestureIndex = index;
        }
      },
      onTrainingSetChanged(set) {
        // console.log('dispatching training set');
        this.$store.dispatch('getModelFromTrainingSet', set).
        then((model) => { this.gestureRecognition.setModel(model); });
      },
      stillAutoTriggerBridgeCallback(frame) {
        if (frame.data[0] === 1) {
          if (this.gestureIndex !== null) {
            this.gestureRecognition.startRecording(this.gestureIndex);
            // this.gestureRecRenderer.reset();
            this.reset = true;
            this.reset = false;

            if (this.recBtnClasses[this.gestureIndex] === 'armed') {
              this.recBtnClasses[this.gestureIndex] = 'recording';
            }
          }

          this.gestureRecognition.reset();
          this.gestureRecognitionOnOff.setState('on');
        } else {
          if (this.gestureIndex !== null &&
              this.recBtnClasses[this.gestureIndex] === 'recording') {
            this.recBtnClasses[this.gestureIndex] = '';
            // don't forget this !!!
            // (calls this.gestureRecognition.stopRecording() as well)
            this.onRecBtnClassesChanged(this.gestureIndex);
          }

          this.gestureRecognitionOnOff.setState('off');
        }
      },
      gestureRecordingBridgeCallback(frame) {
        if (this.gestureRecognition.recording) {
          this.frame = frame.data;
        }
      },
      gestureRecognitionBridgeCallback(frame) {
        if (frame.data[0] !== 0) {
          const index = frame.data[0] - 1;
          this.focus = index;
          this.percents[index] = frame.data[1];
          this.percents = this.percents.slice(0);
        } else {
          this.focus = -1;
        }

        const message = {};
        message[`${this.id}`] = {
          destination: `port ${config.localOscServer.remotePort}`,
          address: this.addresses[0],
          args: [
            { type: 'i', value: frame.data[0] },
            { type: 'f', value: frame.data[1] },
          ],
        };
        this.$store.dispatch('updateOutputLocalOscFrame', message)
      }
    },
  };
</script>