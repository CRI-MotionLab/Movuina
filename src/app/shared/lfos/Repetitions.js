import { BaseLfo } from 'waves-lfo/core';

// nevermind this, should be better defined to be a lfo
// (and should be able to control the parameters of other lfos, not only be the input)

/*
const defaultPrecisionFilterParameters = {};

class PrecisionFilter extends BaseLfo {
  constructor(options = {}) {
    super(defaultPrecisionFilterParameters, options);
  }

  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);
    // do stuff
    this.propagateStreamParams();
  }

  processFrame(frame) {
    this.prepareFrame();
    this.processFunction(frame);
  }

  processVector(frame) {
    // do stuff
  }
}
//*/

// this lfo has been transcribed from the StepDetection sub-patch of the original
// Movuino Interface Max project

const defaultRepetitionsParameters = {};

class Repetitions extends BaseLfo {
  constructor(options = {}) {
    super(defaultRepetitionsParameters, options);
    this.energy = 0;
    this.energyBuffer = [];
    this.energyBufferLength = 50;
    this.energyBufferIndex = 0;
    this.precisionThreshold = 5;     // ajustable
    this.lastSentEnergyValue = 1e9;
    this.min = 1e9;
    this.max = -1e9;
    this.sum = 0; // not used
    this.halfRange = 0; // dynamic threshold detection

    // Initialize buffer
    for (let i = 0; i < this.energyBufferLength; i++) {
      this.energyBuffer.push(0);
    }
  }

  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameType = 'vector';
    this.streamParams.frameSize = 3;
    this.streamParams.description = [ 'energy', 'dynamicTrigThreshold', 'trig' ];

    this.propagateStreamParams();
  }

  // overriding this method allows to get the handle on propagateFrame and send
  // some sparse data

  // processFrame(frame) {
  //   this.prepareFrame();
  //   this.processFunction(frame);
  // }

  processVector(frame) {
    const frameSize = this.streamParams.frameSize;
    if (frameSize !== 3) return;

    // Get new value
    // transcribed from patch preprocessing (energy) :
    const d = frame.data;
    this.energy = 100 * Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

    // check data presicion
    if (Math.abs(this.energy - this.lastSentEnergyValue) < this.precisionThreshold) {
      this.energy = this.lastSentEnergyValue;
    }

    // Update buffer
    // then do the stuff and propagate frames : transcribed from StepDetection
    if (this.energyBufferIndex < this.energyBufferLength) {
      this.energyBuffer[this.energyBufferIndex] = this.energy;
      this.energyBufferIndex++;
    } else {
      // compute new range and threshold
      this.min = 1e9;  // reset minimum
      this.max = -1e9; // reset maximum
      for (let i = 0; i < this.energyBufferLength; i++) {
        if (this.energyBuffer[i] < this.min) {
          this.min = this.energyBuffer[i];         // get new minimum
        }

        if (this.energyBuffer[i] > this.max) {
          this.max = this.energyBuffer[i];         // get new maximum
        }
      }
      this.halfRange = (this.max + this.min) * 0.5;     // compute new halfRange value

      this.energyBufferIndex = 0;  // reset buffer
    }

    // Check cycle detection
    let trig = 0;   // no trig
    if (this.energy >= this.halfRange && this.lastSentEnergyValue < this.halfRange) {
      trig = 1;     // trig up
    }
    if (this.energy <= this.halfRange && this.lastSentEnergyValue > this.halfRange) {
      trig = 2;     // trig down
    }
    this.lastSentEnergyValue = this.energy;
    this.frame.time = frame.time;
    this.frame.data[0] = this.energy;
    this.frame.data[1] = this.halfRange;
    this.frame.data[2] = trig;
    this.frame.metadasata = frame.metadata;
  }
};

 export default Repetitions;
