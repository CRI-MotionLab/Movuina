import { BaseLfo } from 'waves-lfo/core';

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
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameRate = parseInt(this.params.get('resamplingFrequency'));
    this.streamParams.frameSize = prevStreamParams.frameSize;

    if (this.interval !== null) {
      this.stop();
      this.start();
    }

    this.propagateStreamParams();
  }

  processVector(frame) {
    // this.prepareFrame();
    this.frame.metadata = frame.metadata;
    for (let i = 0; i < this.frame.data.length; i++) {
      this.frame.data[i] = frame.data[i];
    }
  }

  _resampleCallback() {
    this.frame.time = Date.now();
    this.propagateFrame();
  }
};

export default Resampler;
