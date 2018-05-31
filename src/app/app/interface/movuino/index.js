import { ipcRenderer as ipc, remote } from 'electron';
import Script from '../../../shared/core/Script';
import Movuino from './Movuino';
import Connections from './Connections';
import Computer from './Computer';

//============================ ELECTRON STUFF ================================//

ipc.on('renderer', function(e, arg) {
  if (arg === 'toggledevtools') {
    remote.getCurrentWindow().toggleDevTools();
  }
});

window.addEventListener('beforeunload', (e) => {
  ipc.send('renderer', 'refresh');
});

//=========================== MOVUINO INTERFACE ==============================//

// the Script class makes sure all the DOM is loaded
class Main extends Script {
  constructor() {
    super();
    this.movuino = new Movuino();
    this.connections = new Connections();
    this.computer = new Computer();
  }

  loaded() {
    this.movuino.init();
    this.connections.init();
    this.computer.init();

    // this.movuino.on('sensors', (sensors) => {
    //   this.computer.setWaveformData(sensors);
    // });

    this.movuino.on('connected', (connected) => {
      this.computer.setMovuinoConnected(connected);
    });
  }
};

console.log('bonne nuit les petits');

const main = new Main();
