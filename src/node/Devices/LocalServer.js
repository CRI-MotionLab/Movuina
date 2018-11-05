import EventEmitter from 'events';
import osc from 'osc';

import controller from '../ViewController';
import config from '../../config';

class LocalServer extends EventEmitter {
  constructor(id = null) {
    super();
    // this.movuinoId = id;
    this.udpPort = new osc.UDPPort(config.localOscServer);

    this._processOscInput = this._processOscInput.bind(this);
    this._processOscOutput = this._processOscOutput.bind(this);
  }

  // executeCommand(origin, cmd, arg) {
  //   if (origin === 'controller') {
  //     switch (cmd) {
  //       case 'osc':
  //         this.send(arg.message);
  //         break;
  //       default:
  //         break;
  //     }
  //   }
  // }

  start() {
    return new Promise((resolve, reject) => {
      ////////// catch osc errors and simply ignore them
      this.udpPort.on('error', (err) => { /*console.log('osc error : ' + err.message);*/ });

      this.udpPort.on('ready', () => {
        this.udpPortReady = true;
        resolve();
      });

      this.udpPort.on('message', (message) => {
        this.emit('osc', message); // eventually add stuff in this object
        this._processOscInput(message);
      });

      this.udpPort.open();
    });

  }

  stop() {
    return new Promise((resolve, reject) => {
      const closeListener = () => {
        console.log('local server closed normally');
        resolve();
      }

      const errorListener = (err) => {
        if (err.message === 'Port is not open') {
          console.log('port not open');
          this.udpPort.removeListener('close', closeListener);
          this.udpPort.removeListener('error', errorListener);
          resolve();            
        }
      }

      this.udpPort.removeAllListeners();
      this.udpPort.once('close', closeListener);
      this.udpPort.on('error', errorListener); 
      this.udpPort.close();
    });

    // const closeListener = () => {
    // };


    // const errorListener = (err) => {
    // }

    // this.udpPort.once('closed', closeListener);
    // this.udpPort.on('error', errorListener);

    // this.udpPort.close();
  }

  send(message) {
    try {
      this.udpPort.send(message);
    } catch (err) {
      // console.error('error : ' + err.message);
    }
  }

  _processOscInput(message) {

  }

  _processOscOutput() {

  }
};

const instance = new LocalServer();

export default instance;