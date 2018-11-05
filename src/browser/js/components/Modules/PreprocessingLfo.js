import EventEmitter from 'events';
import * as lfo from 'waves-lfo/common';
import MovingAverage from '../../lfos/MovingAverage';
import EventIn from '../../lfos/EventIn';
import Resampler from '../../lfos/Resampler';

class Preprocessing extends EventEmitter {
  constructor() {
    super();

    this.resamplingFrequency = 5;
    this.filterSize = 30;
    this.playing = false;

    //------------------------- LFOs instanciation ---------------------------//
    this.eventIn = new EventIn({
      frameSize: 9,
      frameType: 'vector',
      frameRate: 1,
      // absoluteTime: true,
    });

    this.resampler = new Resampler({
      resamplingFrequency: this.resamplingFrequency,
    });

    this.mvAvrg = new MovingAverage({ // lfo.operator.MovingAverage({
      order: this.filterSize,
      fill: 0,
    });

    this.outputBridge = new lfo.sink.Bridge({
      processFrame: (frame) => { this.outputBridgeCallback(frame); },
    });

    this.rawRecorder = new lfo.sink.DataRecorder({
      callback: (data) => { this.processRecordedData(data); }
    });

    //------------------------- LFOs graph creation --------------------------//
    this.eventIn.connect(this.resampler);
    this.resampler.connect(this.mvAvrg);

    this.mvAvrg.connect(this.outputBridge);
    this.mvAvrg.connect(this.rawRecorder);
  }

  setResamplingFrequency(f) {
    console.log('setting new resampling frequency ' + f);
    this.resamplingFrequency = f;
    this.resampler.params.set('resamplingFrequency', f);
  }

  setFilterSize(s) {
    console.log('setting new filtersize ' + s);
    this.filterSize = s;
    this.mvAvrg.params.set('order', s);
  }

  process(f) {
    const inputSensorData = [
      f.accx, f.accy, f.accz,
      f.gyrx, f.gyry, f.gyrz,
      f.magx, f.magy, f.magz,
    ];

    this.eventIn.process(null, inputSensorData);
  }

  start() {
    this.eventIn.start();
    this.resampler.start();
    this.playing = true;
  }

  stop() {
    this.resampler.stop();
    this.eventIn.stop();
    this.playing = false;
  }

  startRecording() {
    this.rawRecorder.start();
  }

  stopRecording() {
    this.rawRecorder.stop();
  }

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
};

export default Preprocessing;