import EventEmitter from 'events';
// import * as lfo from 'waves-lfo/common';
// import MovingAverage from '../../lfos/MovingAverage';
// import EventIn from '../../lfos/EventIn';
// import Resampler from '../../lfos/Resampler';

class Preprocessing extends EventEmitter {
  constructor() {
    super();

    this.resamplingFrequency = 25;
    this.resamplingPeriod = 1000 / this.resamplingFrequency;
    this.maxFilterSize = 50;
    this.filterSize = 1;
    this.playing = false;

    this.timeout = null;

    this.buffers = [];
    this.inputData = [];
    this.sums = [];

    this.recordBuffer = [];
    this.isRecording = false;

    for (let i = 0; i < 9; i++) {
      const arr = [ 0 ]; // we want maxFilterSize + 1 elements
      for (let j = 0; j < this.maxFilterSize; j++) {
        arr.push(0);
      }
      this.buffers.push(arr);
      this.inputData.push(0);
      this.sums.push(0);

      // this.outFrame = {};
    }

    this._resamplerCallback = this._resamplerCallback.bind(this);
  }

  setResamplingFrequency(f) {
    this.resamplingFrequency = Math.max(1, f);
    this.resamplingPeriod = 1000 / f;
  }

  setFilterSize(s) {
    this.filterSize = Math.min(Math.max(1, s), this.maxFilterSize);
  }

  process(frame) {
    this.inputData = [
      frame.accx, frame.accy, frame.accz,
      frame.gyrx, frame.gyry, frame.gyrz,
      frame.magx, frame.magy, frame.magz,
    ];
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this._resamplerCallback();
  }

  stop() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.playing = false;
  }

  startRecording() {
    this.recordBuffer = [];
    this.recording = true;
  }

  stopRecording() {
    if (!this.recording) return;

    this.recording = false;
    if (this.recordBuffer.length > 0) {
      this.emit('recording', this.recordBuffer);
    }
  }

  _resamplerCallback() {
    if (this.playing) {
      const filtered = [];

      for (let i = 0; i < 9; i++) {
        this.buffers[i].push(this.inputData[i]);
        this.buffers[i].splice(0, 1);

        this.sums[i] = 0;
        for (let j = 0; j < this.filterSize; j++) {
          this.sums[i] += this.buffers[i][this.maxFilterSize - j];
        }

        filtered.push(this.sums[i] / this.filterSize);
      }

      if (this.recording) {
        this.recordBuffer.push({
          time: window.performance.now(),
          data: filtered,
        });
      }

      this.emit('frame', filtered);
      this.timeout = setTimeout(this._resamplerCallback, this.resamplingPeriod);
    }
  }

  // displayBridgeCallback(frame) {
  //   // console.log(frame);
  //   const sensors = frame.data;

  //   const acc = [];
  //   const gyr = [];
  //   const mag = [];

  //   for (let i = 0; i < 3; i++) {
  //     acc.push(sensors[i]);
  //     gyr.push(sensors[i + 3]);
  //     mag.push(sensors[i + 6]);
  //   }

  //   this.setWaveformData([ acc, gyr, mag ]);
  // }

  /*
  outputBridgeCallback(frame) {
    const arrayFrame = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

    for (let i = 0; i < frame.data.length; i++) {
      arrayFrame[i] = frame.data[i];
    }

    this.emit('frame', arrayFrame);
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
  //*/
};

export default Preprocessing;