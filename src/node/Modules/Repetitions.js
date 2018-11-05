import EventEmitter from 'events';

class Repetitions extends EventEmitter {
  constructor() {
    super();
  }
};

const instance = new Repetitions();

export default instance;