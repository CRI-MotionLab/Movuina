import preprocessing  from './Modules/Preprocessing';
import repetitions from './Modules/Repetitions';
import gestureRecognition from './Modules/GestureRecognition';
import controller from './ViewController';

class Modules {
  constructor() {
    controller.addListener('recording', (recording) => {
      preprocessing.createFile(recording);
    });

    gestureRecognition.on('model', (model) => {
      controller.send('setModelFromTrainingSet', model);
    });

    controller.addListener('getModelFromTrainingSet', (set) => {
      gestureRecognition.train(set);
    });
  }
};

export default Modules;