import { Example, TrainingSet, XmmProcessor } from 'mano-js/common';

class GestureRecognition {
  constructor(trainCallback, /*options = {}*/) {
    // super(defaultParameters, options);

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

  process(frame) {
    if (this.recording) {
      this.example.addElement(frame);
    }

    const res = this.xmmProcessor.run(frame);

    if (res === null || res.likeliest === null) {
      return [ 0, 0 ];
    } else {
      return [
        parseInt(res.likeliest) + 1,
        res.timeProgressions[res.likeliestIndex],
      ];
    }
  }
};
