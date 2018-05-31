import { BaseLfo } from 'waves-lfo/core';

const defaultResamplerParameters = {
  resamplingFrequency: {
    type: 'integer',
    default: 30,
    metas: { kind: 'static' }, // will trigger reinit stream params
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

  // NO USE FOR THIS, AS WE SAID "metas: { kind: 'static' }" in the parameters
  // processStreamParams is called back automatically

  // onParamUpdate(name, value, metas) {
  //   if (name === 'resamplingFrequency') {
  //     this.processStreamParams(this.prevStreamParams);
  //   }
  // }

  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameRate = parseInt(this.params.get('resamplingFrequency'));
    this.streamParams.frameSize = prevStreamParams.frameSize;

    if (this.interval !== null) {
      this.stop();
      this.start();
    }

    this.propagateStreamParams();
  }

  processFrame(frame) {
    this.prepareFrame();
    this.processFunction(frame);
  }

  processVector(frame) {
    // this.prepareFrame();

    this.frame.metadata = frame.metadata;
    for (let i = 0; i < frame.data.length; i++) {
      this.frame.data[i] = frame.data[i];
    }
  }

  _resampleCallback() {
    this.frame.time = Date.now();
    this.propagateFrame();
  }
};

export default Resampler;
