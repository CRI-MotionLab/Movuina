import { ipcRenderer as ipc } from 'electron';
import WaveformRenderer from '../../../shared/core/WaveformRenderer';
import RepetitionsRenderer from '../../../shared/core/RepetitionsRenderer';
import * as lfo from 'waves-lfo/client';
import * as lfoMotion from 'lfo-motion';
import EventEmitter from 'events';
import Resampler from '../../../shared/lfos/Resampler';
import Repetitions from '../../../shared/lfos/Repetitions';
import GestureRecognition from '../../../shared/lfos/GestureRecognition';

class Computer extends EventEmitter {
  constructor() {
    super();
    const lightYellow = '#fff17a';
    const lightBlue = '#7cdde2';
    const lightRed = '#f45a54';
    this.lightGrey = '#555';
    this.fillStyles = [ lightYellow, lightBlue, lightRed ];
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

    this.sensorsData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.displayBridgeCallback = this.displayBridgeCallback.bind(this);
    this.rawBridgeCallback = this.rawBridgeCallback.bind(this);
    this.repetitionsBridgeCallback = this.repetitionsBridgeCallback.bind(this);
    this.gestureRecognitionBridgeCallback = this.gestureRecognitionBridgeCallback.bind(this);

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
      resamplingFrequency: 25,
    });
    this.displayBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.displayBridgeCallback(frame); },
    });

    this.rawBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.rawBridgeCallback(frame); },
    });

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

    this.gestureRecognition = new GestureRecognition();
    this.gestureRecognitionBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.gestureRecognitionBridgeCallback(frame); },
    });

    //========================= LFO GRAPH CREATION ===========================//

    this.eventIn.connect(this.resampler);
    this.resampler.connect(this.mvAvrg);

    this.mvAvrg.connect(this.displayResampler);
    this.displayResampler.connect(this.displayBridge);
    // this.mvAvrg.connect(this.displayBridge);

    this.mvAvrg.connect(this.rawBridge);

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

    this.mvAvrg.connect(this.gestureRecognition);
    this.gestureRecognition.connect(this.gestureRecognitionBridge);
  }

  init() {
    this.$vibroOnOff = document.querySelector('#movuino-interaction-vibrator-on-off');
    this.$vibroPulseOnDuration = document.querySelector('#movuino-interaction-pulse-on-duration');
    this.$vibroPulseOffDuration = document.querySelector('#movuino-interaction-pulse-off-duration');
    this.$vibroPulseNbRepetitions = document.querySelector('#movuino-interaction-pulse-nb-repetitions');
    this.$vibroPulseTrigBtn = document.querySelector('#movuino-interaction-pulse-trig-btn');

    this.$vibroOnOff.addEventListener('click', () => {
      const on = this.$vibroOnOff.classList.toggle('on');
      if (on) {
        this.onVibroNow([ 1 ]);
      } else {
        this.onVibroNow([ 0 ]);
      }
    });

    this.$vibroPulseTrigBtn.addEventListener('click', () => {
      const onDur = parseInt(this.$vibroPulseOnDuration.value);
      const offDur = parseInt(this.$vibroPulseOffDuration.value);
      const nbRepetitions = parseInt(this.$vibroPulseNbRepetitions.value);

      const data = [
        isNaN(onDur) ? 0 : onDur,
        isNaN(offDur) ? 0 : offDur,
        isNaN(nbRepetitions) ? 0 : nbRepetitions,
      ];

      this.onVibroPulse(data);
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
      this.waveformRenderers[i].start();
    }

    // data analysis / repetitions section

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
      this.repetitionsRenderers[i].start();
    }

    ipc.on('oscserver', (e, ...args) => {
      const cmd = args[0];
      const data = args[1];

      if (cmd === 'control') {
        if (data.target === 'sensors') {
          this.sensorsData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

          for (let i = 0; i < Math.min(data.msg.args.length, 9); i++) {
            this.sensorsData[i] = data.msg.args[i];
          }

          this.eventIn.process(0, this.sensorsData);
        } else if (data.target === 'vibroNow') {
          if (data.msg.args[0] === 1) {
            if (!this.$vibroOnOff.classList.contains('on')) {
              this.$vibroOnOff.classList.add('on');
            }
          } else if (data.msg.args[0] === 0) {
            if (this.$vibroOnOff.classList.contains('on')) {
              this.$vibroOnOff.classList.remove('on');
            }
          }

          this.onVibroNow(data.msg.args);
        } else if (data.target === 'vibroPulse') {
          this.$vibroPulseOnDuration.value = data.msg.args[0];
          this.$vibroPulseOffDuration.value = data.msg.args[1];
          this.$vibroPulseNbRepetitions.value = data.msg.args[2];

          this.$vibroPulseTrigBtn.classList.add('on');
          setTimeout(() => {
            this.$vibroPulseTrigBtn.classList.remove('on');
          }, 100);

          this.onVibroPulse(data.msg.args);
        }
      }
    });

    ipc.on('menu', (e, ...args) => {
      if (args[0] === 'showOSCConnections') {
        for (let i = 0; i < 3; i++) {
          this.waveformRenderers[i].setUpdateDimensionsOnRender(true);
        }

        setTimeout((() => {
          for (let i = 0; i < 3; i++) {
            this.waveformRenderers[i].setUpdateDimensionsOnRender(false);
          }
        }).bind(this), 500);
      }
    });

    this.$zoom = document.querySelector('#zoom-slider');
    this.$zoom.addEventListener('change', () => {
      this.onZoomSliderValueChanged();
    });
    this.$zoom.value = 0;
    this.onZoomSliderValueChanged();

    this.$lineWidth = document.querySelector('#line-width-slider');
    this.$lineWidth.addEventListener('change', () => {
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
    this.$resamplingFrequency.addEventListener('change', () => {
      this.onResamplingFrequencySliderValueChanged();
    });
    this.$resamplingFrequency.value = 50;
    this.onResamplingFrequencySliderValueChanged();

    this.$filterSize = document.querySelector('#filter-size-slider');
    this.$filterSize.addEventListener('change', () => {
      this.onFilterSizeSliderValueChanged();
    });
    this.$filterSize.value = 0;
    this.onFilterSizeSliderValueChanged();

    window.onresize = () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].updateDimensions();
      }
    };

    this.initialized = true;
  }

  onVibroNow(args) {
    ipc.send('oscserver', 'sendOSC', {
      target: 'movuino',
      msg: {
        address: '/vibroNow',
        args: args,
      },
    });
  }

  onVibroPulse(args) {
    ipc.send('oscserver', 'sendOSC', {
      target: 'movuino',
      msg: {
        address: '/vibroPulse',
        args: args,
      },
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
  }

  onFilterSizeSliderValueChanged(slider) {
    this.filterSize = parseInt(this.$filterSize.value * 0.49 + 1);
    this.mvAvrg.params.set('order', this.filterSize);
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

    ipc.send('oscserver', 'sendOSC', {
      target: 'local',
      msg: {
        address: '/filteredSensors',
        args: arrayFrame,
      },
    });
  }

  repetitionsBridgeCallback(frame) {
    if (frame.data.length === 9) {
      for (let i = 0; i < 3; i++) {
        const energy = frame.data[i * 3];
        const dynamicTrigThreshold = frame.data[i * 3 + 1];

        this.repetitionsRenderers[i].setData(energy, dynamicTrigThreshold);

        if (frame.data[i * 3 + 2] === 1) {
          const btn = this.$repetitionsBtnTrigs[i];

          ipc.send('oscserver', 'sendOSC', {
            target: 'local',
            msg: {
              address: '/repetitions',
              args: [[ 'accelerometer', 'gyroscope', 'magnetometer' ][i]],
            },
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

  gestureRecognitionBridgeCallback(frame) {
    // TODO

    // ipc.send('oscserver', 'sendOSC', {
    //   target: 'local',
    //   msg: {
    //     address: '/gestureRecognition',
    //     args: arrayFrame,
    //   },
    // });
  }

  setMovuinoConnected(connected) {
    this.movuinoConnected = connected;

    if (!connected) {
      this.displayResampler.stop();
      this.resampler.stop();
      this.eventIn.stop();
    } else {
      this.eventIn.start();
      this.resampler.start();
      this.displayResampler.start();
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