import EventEmitter from 'events';
import rapidMixAdapters from 'rapid-mix-adapters';
import xmm from 'xmm-node';

class GestureRecognition extends EventEmitter {
  constructor() {
    super();
    this.hhmm = new xmm('hhmm');
    this.hhmm.setConfig({
      absoluteRegularization: 0.01,
      relativeRegularization: 0.001,
      states: 10,
    });
  }

  // here we could persist the training set and the model

  train(set) {
    if (set === null) {
      this.hhmm.clearTrainingSet();
      this.emit('model', null);
    } else {
      this.hhmm.setTrainingSet(rapidMixAdapters.rapidMixToXmmTrainingSet(set));
      this.hhmm.train((err, model) => {
        if (err) {
          console.error(err.message);
        } else {
          this.emit('model', rapidMixAdapters.xmmToRapidMixModel(model));
        }
      });
    }
  }
};

const instance = new GestureRecognition();

export default instance;