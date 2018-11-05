import EventEmitter from 'events';

class Repetitions extends EventEmitter {
  constructor() {
    super();

    // super(defaultRepetitionsParameters, options);
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

  process(frame) {
    // return;
    // const frameSize = this.streamParams.frameSize;
    // if (frameSize !== 3) return;

    // Get new value
    // transcribed from patch preprocessing (energy) :
    // const d = frame.data;
    this.energy = 100 * Math.sqrt(frame[0] * frame[0] + frame[1] * frame[1] + frame[2] * frame[2]);

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

    return {
      value: this.energy,
      threshold: this.halfRange,
      min: this.min,
      max: this.max,
      trig
    };
  }
};

export default Repetitions;