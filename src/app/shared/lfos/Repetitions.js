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
    this.precisionThreshold = 5;
    this.lastSentEnergyValue = 1e9;
    this.filteredEnergyBuffer = [];
    this.filteredEnergyBufferLength = 50;
    this.filteredEnergyBufferIndex = 0;
    this.min = 1e9;
    this.max = -1e9;
    this.sum = 0; // not used
    this.mean = 0; // well, not a real mean, rather the dynamic trig threshold

    for (let i = 0; i < this.energyBufferLength; i++) {
      this.energyBuffer.push(0);
    }

    for (let i = 0; i < this.filteredEnergyBufferLength; i++) {
      this.filteredEnergyBuffer.push(0);
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

    // transcribed from patch preprocessing (energy) :

    const d = frame.data;
    this.energy = 100 * Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

    // this goes to bg coloured slider

    // transcribed from DynamicRange.js

    this.energyBuffer.push(this.energy);
    const first = this.energyBuffer.shift();
    // const last = this.energy;

    // this.sum += last
    // this.sum -= first;
    // this.mean = this.sum / this.energyBufferLength;

    let min = 1e9; // huuuuge positive
    let max = -1e9; // huuuuuuuuge negative

    for (var i = 0; i < this.energyBuffer.length; i++) {
      if (this.energyBuffer[i] < min) {
        min = this.energyBuffer[i];
      }

      if (this.energyBuffer[i] > max) {
        max = this.energyBuffer[i];
      }
    }

    let range = max - min;

    // transcribed from patch intermediary processing

    range *= 0.1; // arbitrary factor

    if (range > 1) {
      this.precisionThreshold = range >= 0 ? range : this.precisionThreshold;
    }

    // transcribed from DataPrecisionFilter

    let trig = 0; // don't trig, 1: up trig, 2: down trig

    if (Math.abs(this.energy - this.lastSentEnergyValue) > this.precisionThreshold) {
      // this.lastSentEnergyValue = this.energy;

      // then do the stuff and propagate frames :
      // transcribed from StepDetection

      if (this.filteredEnergyBufferIndex < this.filteredEnergyBufferLength) {
        this.filteredEnergyBuffer[this.filteredEnergyBufferIndex] = this.energy;
        this.filteredEnergyBufferIndex++;
      } else {
        this.filteredEnergyBufferIndex = 0;
        this.min = 1e9;
        this.max = -1e9;

        for (let i = 0; i < this.filteredEnergyBufferLength; i++) {
          if (this.filteredEnergyBuffer[i] < min) {
            this.min = this.filteredEnergyBuffer[i];
          }

          if (this.filteredEnergyBuffer[i] > max) {
            this.max = this.filteredEnergyBuffer[i];
          }
        }
      }

      this.mean = (this.max + this.min) * 0.5;

      if (this.energy >= this.mean && this.lastSentEnergyValue < this.mean) {
        trig = 1;
      }

      if (this.energy <= this.mean && this.lastSentEnergyValue > this.mean) {
        trig = 2;
      }

      this.lastSentEnergyValue = this.energy;
    }

    this.frame.data[0] = this.energy;
    this.frame.data[1] = this.mean;
    this.frame.data[2] = trig;
  }
};

export default Repetitions;
