import { ipcRenderer as ipc } from 'electron';
import WaveformRenderer from '../../../shared/core/WaveformRenderer';
import { BaseLfo } from 'waves-lfo/core';
import * as lfo from 'waves-lfo/client';
import * as lfoMotion from 'lfo-motion';
import EventEmitter from 'events';

const defaultResamplerParameters = {
  resamplingFrequency: {
    type: 'integer',
    default: 30,
    metas: 'static', // will trigger reinit stream params
  },
};

class Resampler extends BaseLfo {
  constructor(options = {}) {
    super(defaultResamplerParameters, options);
    this.interval = null;
    this.processFrame = this.processFrame.bind(this);
  }

  start() {
    this.interval = setInterval(this._resampleCallback.bind(this), parseInt(1000 / this.params.get('resamplingFrequency')));
  }

  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  onParamUpdate(name, value, metas) {
    if (name === 'resamplingFrequency') {
      this.processStreamParams();
    }
  }

  processStreamParams(prevStreamParams = {}) {
    console.log('processing stream params');
    Object.assign(this.streamParams, prevStreamParams);
    // console.log(prevStreamParams);
    // console.log(this.streamParams);
    this.streamParams.frameRate = parseInt(this.params.get('resamplingFrequency'));
    if (this.interval !== null) {
      this.stop();
      this.start();
    }

    this.propagateStreamParams();
  }

  processFrame(frame) {
    // this.prepareFrame();
    this.frame.metadata = frame.metadata;
    for (let i = 0; i < this.frame.data.length; i++) {
      this.frame.data[i] = frame.data[i];
    }
    // this.frame.data = frame.data.slice(0);
  }

  _resampleCallback() {
    this.frame.time = Date.now();
    this.propagateFrame();
  }
}

//============================================================================//

class Computer extends EventEmitter {
  constructor() {
    super();
    const lightYellow = '#fff17a';
    const lightBlue = '#7cdde2';
    const lightRed = '#f45a54';
    this.fillStyles = [ lightYellow, lightBlue, lightRed ];
    this.initialized = false;

    this.inputPeriod = 5
    this.resamplingFrequency = 30; // Hz
    this.filterSize = 1; // pts

    this.sensorsData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.displaySensorsBridge = this.displaySensorsBridge.bind(this);
    this.sensorRepetitionsBridge = this.sensorRepetitionsBridge.bind(this);

    this.movuinoConnected = false;

    this.eventIn = new lfo.source.EventIn({
      frameSize: 9,
      frameType: 'vector',
      frameRate: 1,
    });
    // this.resampler = new lfoMotion.operator.Sampler({
    //   resamplingFrequency: this.resamplingFrequency,
    // });
    this.resampler = new Resampler({
      resamplingFrequency: this.resamplingFrequency,
    });
    this.mvAvrg = new lfo.operator.MovingAverage({
      order: this.filterSize,
      fill: 0,
    });
    this.repetitionsBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.sensorRepetitionsBridge(frame); },
    });
    this.reresampler = new Resampler({
      resamplingFrequency: 25,
    });
    this.displayBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.displaySensorsBridge(frame); },
    });

    this.eventIn.connect(this.resampler);
    this.resampler.connect(this.mvAvrg);
    // this.resampler.connect(this.reresampler);
    // this.reresampler.connect(this.mvAvrg);
    // this.mvAvrg.connect(this.filterBridge);

    this.mvAvrg.connect(this.repetitionsBridge);

    this.mvAvrg.connect(this.reresampler);
    this.reresampler.connect(this.displayBridge);
  }

  init() {
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
      this.waveformRenderers[i].start();
    }

    this.$zoom = document.querySelector('#zoom-slider');
    this.$zoom.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].zoom = this.$zoom.value * 0.01;
      }
    });

    this.$lineWidth = document.querySelector('#line-width-slider');
    this.$lineWidth.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].lineWidth = this.$lineWidth.value * 0.01 + 1;
      }
    });

    this.$lineStyle = document.querySelector('#line-style-menu');
    this.$lineStyle.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].lineStyle = this.$lineStyle.value;
      }
    });

    this.$pointStyle = document.querySelector('#point-style-menu');
    this.$pointStyle.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].pointStyle = this.$pointStyle.value;
      }
    });

    ipc.on('oscmessage', (e, ...args) => {
      if (args[0] === 'input' && args[1].address.split('/').pop() === 'sensors') {
        this.sensorsData = [];

        for (let i = 0; i < 9; i++) {
          this.sensorsData.push(args[1].args[i].value);
        }

        this.eventIn.process(0, this.sensorsData);
      }
    });

    this.$resamplingFrequency = document.querySelector('#resampling-frequency-slider');
    this.$resamplingFrequency.addEventListener('change', () => {
      this.resamplingFrequency = parseInt(this.$resamplingFrequency.value * 0.95 + 5);
      this.resampler.params.set('resamplingFrequency', this.resamplingFrequency);
      // this.updateResamplingFrequency();
    });

    this.$filterSize = document.querySelector('#filter-size-slider');
    this.$filterSize.addEventListener('change', () => {
      this.filterSize = parseInt(this.$filterSize.value * 0.49 + 1);
      this.mvAvrg.params.set('order', this.filterSize);
    });

    // this.eventIn.start();
    // this.resampler.start();
    // this.reresampler.start();

    window.onresize = () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].updateDimensions();
      }
    };

    this.initialized = true;
  }

  displaySensorsBridge(frame) {
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

  sensorRepetitionsBridge(frame) {
    // send frame via OSC through from here

    // also add Adrien's code here : DynamicRange and StepDetection
    // if one of the 3 sensors trigs, add the "on" class to the corresponding round div
    // then remove the "on" class with a short setTimeout
    // and send the appropriate OSC messages

    // then also drive an xmm system and also send some OSC messages
  }

  setMovuinoConnected(connected) {
    this.movuinoConnected = connected;

    if (!connected) {
      this.reresampler.stop();
      this.resampler.stop();
      this.eventIn.stop();
    } else {
      this.eventIn.start();
      this.resampler.start();
      this.reresampler.start();
    }
  }

  setWaveformData(data) {
    if (this.initialized) {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].setData(data[i]);

        for (let j = 0; j < this.$waveformLabels[i].length; j++) {
          this.$waveformLabels[i][j].innerHTML = parseFloat(data[i][j]).toFixed(2);
        }
      }
    }
  }
};

export default Computer;