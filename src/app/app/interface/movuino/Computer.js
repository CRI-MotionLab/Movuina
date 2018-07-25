import { ipcRenderer as ipc } from 'electron';
import EventEmitter from 'events';

import WaveformRenderer from '../../../shared/renderers/WaveformRenderer';
import RepetitionsRenderer from '../../../shared/renderers/RepetitionsRenderer';
import GestureRecorderRenderer from '../../../shared/renderers/GestureRecorderRenderer';
import GestureFollowerRenderer from '../../../shared/renderers/GestureFollowerRenderer';

import * as lfo from 'waves-lfo/client';

import Resampler from '../../../shared/lfos/Resampler';
import Repetitions from '../../../shared/lfos/Repetitions';
import Intensity from '../../../shared/lfos/Intensity';
import StillAutoTrigger from '../../../shared/lfos/StillAutoTrigger';
import GestureRecognition from '../../../shared/lfos/GestureRecognition';
import { colors, getMovuinoIdAndOSCSuffixFromAddress } from '../../core/util';

class Computer extends EventEmitter {
  constructor() {
    super();

    this.info = null;

    // const lightYellow = '#fff17a';
    // const lightBlue = '#7cdde2';
    // const lightRed = '#f45a54';

    this.lightGrey = '#555';
    this.fillStyles = colors; // [ lightYellow, lightBlue, lightRed ];
    this.initialized = false;

    this.inputPeriod = 5
    this.resamplingFrequency = 30; // Hz
    this.filterSize = 1; // pts

    this.onVibroNow = this.onVibroNow.bind(this);
    this.onVibroPulse = this.onVibroPulse.bind(this);

    this.onZoomSliderValueChanged = this.onZoomSliderValueChanged.bind(this);
    this.onLineWidthSliderValueChanged = this.onLineWidthSliderValueChanged.bind(this);
    this.onLineStyleMenuValueChanged = this.onLineStyleMenuValueChanged.bind(this);
    this.onPointStyleMenuValueChanged = this.onPointStyleMenuValueChanged.bind(this);
    this.onResamplingFrequencySliderValueChanged = this.onResamplingFrequencySliderValueChanged.bind(this);
    this.onFilterSizeSliderValueChanged = this.onFilterSizeSliderValueChanged.bind(this);
    this.onRecordDataBtnClick = this.onRecordDataBtnClick.bind(this);
    this.onGestureRecBtnStateChanged = this.onGestureRecBtnStateChanged.bind(this);
    this.onTrainingSetChanged = this.onTrainingSetChanged.bind(this);

    this.sensorsData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.displayBridgeCallback = this.displayBridgeCallback.bind(this);
    this.rawBridgeCallback = this.rawBridgeCallback.bind(this);
    this.processRecordedData = this.processRecordedData.bind(this);
    this.repetitionsBridgeCallback = this.repetitionsBridgeCallback.bind(this);
    this.stillAutoTriggerBridgeCallback = this.stillAutoTriggerBridgeCallback.bind(this);
    this.gestureRecognitionBridgeCallback = this.gestureRecognitionBridgeCallback.bind(this);

    this.gestureIndex = null;

    this.movuinoConnected = false;

    //====================== LFO OPERATORS INSTANCIATION =====================//

    this.eventIn = new lfo.source.EventIn({
      frameSize: 9,
      frameType: 'vector',
      frameRate: 1,
    });

    this.resampler = new Resampler({
      resamplingFrequency: this.resamplingFrequency,
    });
    this.mvAvrg = new lfo.operator.MovingAverage({
      order: this.filterSize,
      fill: 0,
    });

    this.displayResampler = new Resampler({
      resamplingFrequency: 20,
    });
    this.displayBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.displayBridgeCallback(frame); },
    });

    this.rawBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.rawBridgeCallback(frame); },
    });

    this.rawRecorder = new lfo.sink.DataRecorder({
      callback: (data) => { this.processRecordedData(data); }
    })

    this.filteredAccSelector = new lfo.operator.Select({ indexes: [ 0, 1, 2 ] });
    // this.accMagnitude = new lfo.operator.Magnitude();
    // this.accMultiplier = new lfo.operator.Multiplier({ factor: 100 });
    this.accRepetitions = new Repetitions();

    this.filteredGyrSelector = new lfo.operator.Select({ indexes: [ 3, 4, 5 ] });
    // this.gyrMagnitude = new lfo.operator.Magnitude();
    // this.gyrMultiplier = new lfo.operator.Multiplier({ factor: 100 });
    this.gyrRepetitions = new Repetitions();

    this.filteredMagSelector = new lfo.operator.Select({ indexes: [ 6, 7, 8 ] });
    // this.magMagnitude = new lfo.operator.Magnitude();
    // this.magMultiplier = new lfo.operator.Multiplier({ factor: 100 });
    this.magRepetitions = new Repetitions();


    this.repetitionsMerger = new lfo.operator.Merger({ frameSizes: [ 3, 3, 3 ] });

    this.repetitionsBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.repetitionsBridgeCallback(frame); },
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
    this.gestureRecognition = new GestureRecognition(this.onTrainingSetChanged);
    this.gestureRecognitionBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.gestureRecognitionBridgeCallback(frame); },
    });

    //========================= LFO GRAPH CREATION ===========================//

    this.eventIn.connect(this.resampler);
    this.resampler.connect(this.mvAvrg);

    // this.mvAvrg.connect(this.displayResampler);
    // this.displayResampler.connect(this.displayBridge);
    this.mvAvrg.connect(this.displayBridge);

    this.mvAvrg.connect(this.rawBridge);
    this.mvAvrg.connect(this.rawRecorder);

    // this.mvAvrg.connect(this.repetitions);
    // this.repetitions.connect(this.repetitionsBridge);

    // repetitions

    this.mvAvrg.connect(this.filteredAccSelector);
    this.mvAvrg.connect(this.filteredGyrSelector);
    this.mvAvrg.connect(this.filteredMagSelector);

    this.filteredAccSelector.connect(this.accRepetitions);
    this.filteredGyrSelector.connect(this.gyrRepetitions);
    this.filteredMagSelector.connect(this.magRepetitions);

    this.accRepetitions.connect(this.repetitionsMerger);
    this.gyrRepetitions.connect(this.repetitionsMerger);
    this.magRepetitions.connect(this.repetitionsMerger);

    this.repetitionsMerger.connect(this.repetitionsBridge);

    // gesture recognition

    this.mvAvrg.connect(this.intensity);
    this.intensity.connect(this.intensitySelect);
    this.intensitySelect.connect(this.intensityMultiplier);
    this.intensityMultiplier.connect(this.stillAutoTrigger);
    this.stillAutoTrigger.connect(this.stillAutoTriggerBridge);

    this.filteredAccSelector.connect(this.gestureRecognitionOnOff);
    this.gestureRecognitionOnOff.connect(this.gestureRecognition);
    this.gestureRecognition.connect(this.gestureRecognitionBridge);
  }

  //============================= INIT FUNCTION ==============================//

  init() {
    this.$vibroOnOff = document.querySelector('#movuino-interaction-vibrator-on-off');
    this.$vibroPulseOnDuration = document.querySelector('#movuino-interaction-pulse-on-duration');
    this.$vibroPulseOffDuration = document.querySelector('#movuino-interaction-pulse-off-duration');
    this.$vibroPulseNbRepetitions = document.querySelector('#movuino-interaction-pulse-nb-repetitions');
    this.$vibroPulseTrigBtn = document.querySelector('#movuino-interaction-pulse-trig-btn');

    this.$vibroOnOff.addEventListener('click', () => {
      if (this.info === null) return;

      const on = this.$vibroOnOff.classList.toggle('on');
      const address = `/movuino/${this.info.id}/vibroNow`;
      if (on) {
        this.onVibroNow({ address: address, args: [ 1 ] });
      } else {
        this.onVibroNow({ address: address, args: [ 0 ] });
      }
    });

    this.$vibroPulseTrigBtn.addEventListener('click', () => {
      if (this.info === null) return;

      const onDur = parseInt(this.$vibroPulseOnDuration.value);
      const offDur = parseInt(this.$vibroPulseOffDuration.value);
      const nbRepetitions = parseInt(this.$vibroPulseNbRepetitions.value);

      const data = [
        isNaN(onDur) ? 0 : onDur,
        isNaN(offDur) ? 0 : offDur,
        isNaN(nbRepetitions) ? 0 : nbRepetitions,
      ];

      this.onVibroPulse({
        address: `/movuino/${this.info.id}/vibroPulse`,
        args: data,
      });
    });

    // DATA VISUALIZATION :

    this.$sensorWaveforms = [
      document.querySelector('#movuino-accelerometer-waveforms'),
      document.querySelector('#movuino-gyroscope-waveforms'),
      document.querySelector('#movuino-magnetometer-waveforms'),
    ];

    this.$waveformLabels = [
      [
        document.querySelector('#accel-x-waveform-label'),
        document.querySelector('#accel-y-waveform-label'),
        document.querySelector('#accel-z-waveform-label'),
      ],
      [
        document.querySelector('#gyro-x-waveform-label'),
        document.querySelector('#gyro-y-waveform-label'),
        document.querySelector('#gyro-z-waveform-label'),
      ],
      [
        document.querySelector('#magneto-x-waveform-label'),
        document.querySelector('#magneto-y-waveform-label'),
        document.querySelector('#magneto-z-waveform-label'),
      ],
    ];

    this.waveformRenderers = [];

    for (let i = 0; i < 3; i++) {
      const wf = this.$sensorWaveforms[i];
      this.waveformRenderers.push(new WaveformRenderer(wf, this.fillStyles));
      // this.waveformRenderers[i].start();
    }

    this.$zoom = document.querySelector('#zoom-slider');
    this.$zoom.addEventListener('input', () => {
      this.onZoomSliderValueChanged();
    });
    this.$zoom.value = 0;
    this.onZoomSliderValueChanged();

    this.$lineWidth = document.querySelector('#line-width-slider');
    this.$lineWidth.addEventListener('input', () => {
      this.onLineWidthSliderValueChanged();
    });
    this.$lineWidth.value = 50;
    this.onLineWidthSliderValueChanged();

    this.$lineStyle = document.querySelector('#line-style-menu');
    this.$lineStyle.addEventListener('change', () => {
      this.onLineStyleMenuValueChanged();
    });

    this.$pointStyle = document.querySelector('#point-style-menu');
    this.$pointStyle.addEventListener('change', () => {
      this.onPointStyleMenuValueChanged();
    });

    this.$resamplingFrequency = document.querySelector('#resampling-frequency-slider');
    this.$resamplingFrequency.addEventListener('input', () => {
      this.onResamplingFrequencySliderValueChanged();
    });
    this.$resamplingFrequency.value = 48; // will map to 50 Hz in the callback
    this.$resamplingFrequencyValue = document.querySelector('#resampling-frequency-value');
    this.onResamplingFrequencySliderValueChanged();

    this.$filterSize = document.querySelector('#filter-size-slider');
    this.$filterSize.addEventListener('input', () => {
      this.onFilterSizeSliderValueChanged();
    });
    this.$filterSize.value = 0;
    this.$filterSizeValue = document.querySelector('#filter-size-value');
    this.onFilterSizeSliderValueChanged();

    //=========================== DATA RECORDER ==============================//

    this.$recordDataBtn = document.querySelector('#record-data-btn');
    this.$recordDataBtn.addEventListener('click', () => {
      this.onRecordDataBtnClick();
    });

    this.$recordDataTxt = document.querySelector('#record-data-txt');

    window.onresize = () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].updateDimensions();
      }
    };

    //============================ REPETITIONS ===============================//

    this.$repetitionsCanvasTrigs = [
      document.querySelector('#movuino-accelerometer-repetitions-canvas'),
      document.querySelector('#movuino-gyroscope-repetitions-canvas'),
      document.querySelector('#movuino-magnetometer-repetitions-canvas'),
    ];

    this.$repetitionsBtnTrigs = [
      document.querySelector('#movuino-accelerometer-repetitions-btn'),
      document.querySelector('#movuino-gyroscope-repetitions-btn'),
      document.querySelector('#movuino-magnetometer-repetitions-btn'),
    ];

    this.repetitionsRenderers = [];

    for (let i = 0; i < 3; i++) {
      const rep = this.$repetitionsCanvasTrigs[i];
      this.repetitionsRenderers.push(new RepetitionsRenderer(rep, [ this.fillStyles[i], this.lightGrey ]));
      // this.repetitionsRenderers[i].start();
    }

    //========================== GESTURE RECOGNITION =========================//

    this.$gestureRecBtns = [
      document.querySelector('#gesture-1-rec-btn'),
      document.querySelector('#gesture-2-rec-btn'),
      document.querySelector('#gesture-3-rec-btn')
    ];

    for (let i = 0; i < this.$gestureRecBtns.length; i++) {
      const btn = this.$gestureRecBtns[i];

      btn.addEventListener('click', () => {
        for (let j = 0; j < this.$gestureRecBtns.length; j++) {
          if (i !== j) {
            const b = this.$gestureRecBtns[j];
            if (b.classList.contains('armed')) {
              b.classList.remove('armed');
              this.onGestureRecBtnStateChanged(j, 'off');
            } else if (b.classList.contains('recording')) {
              b.classList.remove('recording');
              this.onGestureRecBtnStateChanged(j, 'off');
            }
          }
        }

        if (btn.classList.contains('armed')) {
          btn.classList.remove('armed');
          this.onGestureRecBtnStateChanged(i, 'off');
        } else if (btn.classList.contains('recording')) {
          btn.classList.remove('recording');
          this.onGestureRecBtnStateChanged(i, 'off');
        } else {
          btn.classList.add('armed');
          this.onGestureRecBtnStateChanged(i, 'armed');
        }
      });
    }

    this.$gestureRecCanvas = document.querySelector('#gesture-rec-display-canvas');
    this.gestureRecRenderer = new GestureRecorderRenderer(this.$gestureRecCanvas, this.fillStyles);

    this.$gestureClearBtn = document.querySelector('#gesture-clear-btn');
    this.$gestureClearBtn.addEventListener('click', () => {
      this.gestureRecognition.clear();
    });

    this.$gestureFollowCanvas = [
      document.querySelector('#gesture-1-follow-canvas'),
      document.querySelector('#gesture-2-follow-canvas'),
      document.querySelector('#gesture-3-follow-canvas'),
    ];

    this.gestureFollowRenderers = [];

    for (let i = 0; i < 3; i++) {
      const gf = this.$gestureFollowCanvas[i];
      const gfRenderer = new GestureFollowerRenderer(gf, this.fillStyles)
      this.gestureFollowRenderers.push(gfRenderer);
      // this.gestureFollowRenderers[i].start();
    }

    this.setMovuinoConnected(true);
    this.setMovuinoConnected(false);
    this.initialized = true;
  }

  //-------------------------- END OF INIT FUNCTION --------------------------//

  updateInfo(movuinoInfo) {
    this.info = movuinoInfo.info;
    // this.setMovuinoConnected(this.info.udpPortReady);
  }

  processOSCMessage(message) {
    if (this.info === null) return;

    const msg = message.message;
    const parts = getMovuinoIdAndOSCSuffixFromAddress(msg.address);

    if (parts === null) return;
    if (parts.id !== this.info.id) return;

    switch (parts.suffix) {
      case '/frame':
        this.sensorsData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

        for (let i = 0; i < Math.min(msg.args.length, 9); i++) {
          this.sensorsData[i] = msg.args[i];
        }

        this.eventIn.process(0, this.sensorsData);
        break;
      case '/vibroNow':
        if (msg.args[0] === 1) {
          if (!this.$vibroOnOff.classList.contains('on')) {
            this.$vibroOnOff.classList.add('on');
          }
        } else if (msg.args[0] === 0) {
          if (this.$vibroOnOff.classList.contains('on')) {
            this.$vibroOnOff.classList.remove('on');
          }
        }

        this.onVibroNow(msg);
        break;
      case '/vibroPulse':
          this.$vibroPulseOnDuration.value = msg.args[0];
          this.$vibroPulseOffDuration.value = msg.args[1];
          this.$vibroPulseNbRepetitions.value = msg.args[2];

          this.$vibroPulseTrigBtn.classList.add('on');
          setTimeout(() => {
            this.$vibroPulseTrigBtn.classList.remove('on');
          }, 100);

          this.onVibroPulse(msg);
        break;
      default:
        break;
    }
  }

  // this is called on CSS transition when showing / hiding connections
  setUpdateWaveformDimensionsDuring(duration) {
    for (let i = 0; i < 3; i++) {
      this.waveformRenderers[i].setUpdateDimensionsOnRender(true);
    }

    setTimeout((() => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].setUpdateDimensionsOnRender(false);
      }
    }).bind(this), duration);
  }

  onVibroNow(message) {
    this.emit('devices', 'osc', {
      medium: 'wifi',
      message: message
    });
  }

  onVibroPulse(message) {
    this.emit('devices', 'osc', {
      medium: 'wifi',
      message: message
    });
  }

  //========================== menu / slider changes callbacks

  onZoomSliderValueChanged() {
    for (let i = 0; i < 3; i++) {
      this.waveformRenderers[i].zoom = this.$zoom.value * 0.01;
    }
  }

  onLineWidthSliderValueChanged(slider) {
    for (let i = 0; i < 3; i++) {
      this.waveformRenderers[i].lineWidth = this.$lineWidth.value * 0.01 + 1;
    }
  }

  onLineStyleMenuValueChanged(slider) {
    for (let i = 0; i < 3; i++) {
      this.waveformRenderers[i].lineStyle = this.$lineStyle.value;
    }
  }

  onPointStyleMenuValueChanged(slider) {
    for (let i = 0; i < 3; i++) {
      this.waveformRenderers[i].pointStyle = this.$pointStyle.value;
    }
  }

  onResamplingFrequencySliderValueChanged(slider) {
    this.resamplingFrequency = parseInt(this.$resamplingFrequency.value * 0.95 + 5);
    this.resampler.params.set('resamplingFrequency', this.resamplingFrequency);
    this.$resamplingFrequencyValue.innerHTML = this.resamplingFrequency + ' Hz';
  }

  onFilterSizeSliderValueChanged(slider) {
    this.filterSize = parseInt(this.$filterSize.value * 0.49 + 1);
    this.mvAvrg.params.set('order', this.filterSize);
    this.$filterSizeValue.innerHTML = this.filterSize + ' samples';
  }

  onRecordDataBtnClick() {
    if (this.$recordDataBtn.classList.contains('on')) {
      this.$recordDataBtn.classList.remove('on');
      this.rawRecorder.stop();
      if (this.recordInterval) {
        clearInterval(this.recordInterval);
        this.recordInterval = null;
      }
    } else {
      this.$recordDataBtn.classList.add('on');
      this.rawRecorder.start();
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
        this.$recordDataTxt.innerHTML = `
          ${formatWithZeroes(hours, 2)}:${formatWithZeroes(minutes, 2)}:${formatWithZeroes(seconds, 2)}:${formatWithZeroes(ms, 3)}
        `;
      }, 40);
    }
  }

  //===========================

  onGestureRecBtnStateChanged(index, state) {
    if (state === 'off') {
      this.gestureRecognition.stopRecording();
      this.gestureIndex = null;
    } else {
      this.gestureIndex = index;
    }
  }

  onTrainingSetChanged(set) {
    this.emit('machineLearning', 'trainingSet', set);
  }

  setGestureModel(model) {
    this.gestureRecognition.setModel(model);
  }

  //=========================== waves-lfo bridges

  displayBridgeCallback(frame) {
    // console.log(frame);
    const sensors = frame.data;

    const acc = [];
    const gyr = [];
    const mag = [];

    for (let i = 0; i < 3; i++) {
      acc.push(sensors[i]);
      gyr.push(sensors[i + 3]);
      mag.push(sensors[i + 6]);
    }

    this.setWaveformData([ acc, gyr, mag ]);
  }

  rawBridgeCallback(frame) {
    // console.log(frame);
    const arrayFrame = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

    for (let i = 0; i < frame.data.length; i++) {
      arrayFrame[i] = frame.data[i];
    }

    this.emit('localServer', 'osc', {
      message: {
        address: `/movuino/${this.info.id}/sensors`,
        args: arrayFrame,
      }
    });
  }

  processRecordedData(data) {
    if (!Array.isArray(data)) return;

    console.log(data);
    const recording = [];
    // for (let i = 0; i < data; i++)
    data.forEach((datum) => {
      const item = {
        time: datum.time,
        data: []
      };

      for (let i = 0; i < datum.data.length; i++) {
        item.data.push(datum.data[i]);
      }

      recording.push(item);
    });

    this.emit('recording', recording);
  }

  repetitionsBridgeCallback(frame) {
    if (frame.data.length === 9) {
      for (let i = 0; i < 3; i++) {
        const energy = frame.data[i * 3];
        const dynamicTrigThreshold = frame.data[i * 3 + 1];

        this.repetitionsRenderers[i].setData(energy, dynamicTrigThreshold);

        if (frame.data[i * 3 + 2] === 1) {
          const btn = this.$repetitionsBtnTrigs[i];

          this.emit('localServer', 'osc', {
            message: {
              address: `/movuino/${this.info.id}/repetitions`,
              args: [[ 'accelerometer', 'gyroscope', 'magnetometer' ][i]],
            }
          });

          if (!btn.classList.contains('on')) {
            btn.classList.add('on');
            setTimeout(() => {
              if (btn.classList.contains('on')) {
                btn.classList.remove('on');
              }
            }, 100);
          }
        }
      }
    }
  }

  stillAutoTriggerBridgeCallback(frame) {
    const btn = this.gestureIndex !== null
              ? this.$gestureRecBtns[this.gestureIndex]
              : null;

    if (frame.data[0] === 1) {
      if (btn !== null) {
        this.gestureRecognition.startRecording(this.gestureIndex);

        if (btn.classList.contains('armed')) {
          btn.classList.remove('armed');
          btn.classList.add('recording');
        }
      }

      this.gestureRecognition.reset();
      this.gestureRecognitionOnOff.setState('on');
    } else {
      if (btn !== null && btn.classList.contains('recording')) {
        btn.classList.remove('recording');
        // don't forget this !!!
        // (calls this.gestureRecognition.stopRecording() as well)
        this.onGestureRecBtnStateChanged(this.gestureIndex, 'off');
      }

      this.gestureRecognitionOnOff.setState('off');
    }
  }

  gestureRecognitionBridgeCallback(frame) {
    const data = [];
    frame.data.forEach((datum) => { data.push(datum); });

    this.emit('localServer', 'osc', {
      message: {
        address: `/movuino/${this.info.id}/gestures`,
        args: data,
      }
    });
  }

  setMovuinoConnected(connected) {
    if (!connected && this.movuinoConnected) {
      // this.displayResampler.stop();
      this.eventIn.stop();
      this.resampler.stop();

      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].stop();
        this.repetitionsRenderers[i].stop();
        this.gestureFollowRenderers[i].stop();
      }

      this.gestureRecRenderer.stop();
    } else if (connected && !this.movuinoConnected) {
      // this.displayResampler.start();
      this.eventIn.start();
      this.resampler.start();

      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].start();
        this.repetitionsRenderers[i].start();
        this.gestureFollowRenderers[i].start();
      }

      this.gestureRecRenderer.start();
    }

    this.movuinoConnected = connected;
  }

  setWaveformData(data) {
    if (this.initialized) {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].setData(data[i]);

        for (let j = 0; j < 3 /*this.$waveformLabels[i].length*/; j++) {
          this.$waveformLabels[i][j].innerHTML = parseFloat(data[i][j]).toFixed(2);
        }
      }
    }
  }
};

export default Computer;