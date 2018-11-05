import { BaseLfo } from 'waves-lfo/core';
import { Example, TrainingSet, XmmProcessor } from 'mano-js/common';

const defaultParameters = {
  // outputDimension: {
  //   type: 'integer',
  //   default: 0,
  //   metas: { kind: 'static' }, // will trigger reinit stream params
  // },
};

class GestureRecognition extends BaseLfo {
  constructor(trainCallback, options = {}) {
    super(defaultParameters, options);

    this.recording = false;
    this.example = new Example();
    this.trainingSet = new TrainingSet();
    this.xmmProcessor = new XmmProcessor();
    this.trainCallback = trainCallback;
  }

  startRecording(index) {
    if (this.recording) return;

    this.example.setLabel(`${index}`);
    this.recording = true;
  }

  stopRecording() {
    if (!this.recording) return;

    if (this.example.input.length > 0) {
      this.trainingSet.addExample(this.example.toJSON());
      this.example.clear();
      this.trainCallback(this.trainingSet.toJSON());
    }

    this.recording = false;
  }

  clear() {
    this.trainingSet.clear();
    this.trainCallback(this.trainingSet.toJSON());
  }

  reset() {
    this.xmmProcessor.reset();
  }

  setModel(model) {
    this.xmmProcessor.setModel(model);
  }

  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);
    this.streamParams.frameSize = 2;
    this.propagateStreamParams();
  }

  processVector(frame) {
    if (this.recording) {
      this.example.addElement(frame.data);
    }

    const res = this.xmmProcessor.run(frame.data);

    if (res === null || res.likeliest === null) {
      this.frame.data = [ 0, 0 ];
    } else {
      this.frame.data = [
        parseInt(res.likeliest) + 1,
        res.timeProgressions[res.likeliestIndex],
      ];
    }
  }
};

export default GestureRecognition;