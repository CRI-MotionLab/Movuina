import EventEmitter from 'events';
import osc from 'osc';

// this is just a copy of build/config/<used_config_name>.js
// <used_config_name> is "default" by default
// it can be provided as an extra argument to "npm run [watch/build]"
import config from '../../../config';
import { stripMovuinoOSCPrefix } from './util';

//============================= MOVUINO CLASS ================================//

class Movuino extends EventEmitter {
  constructor(id = null) {
    super();

    this.info = {
      id: id,
      firmwareVersion: null,
      ssid: '',
      password: '',
      hostIP: '0.0.0.0',
      wifiState: 0,
      movuinoIP: '0.0.0.0',
      serialPortReady: false,
      udpPortReady: false,
      udpOnline: false,
    };

    this.serialPort = null;

    this.udpPort = null;
    this.udpInterval = null;
    this.udpListening = false;
    this.lastUDPMessageDate = 0;
    this.udpTimeoutDuration = 1000;
    this.outputUDPPort = config.dist.movuinoOSCServer.remotePort;

    this._createSerialPort = this._createSerialPort.bind(this);
    this._closeSerialPort = this._closeSerialPort.bind(this);
    this.udpMessageListener = this.udpMessageListener.bind(this);
    this.serialRpc = this.serialRpc.bind(this);
  }

  /**
   * Initialize a new movuino connection from serial handshake
   * and attach udp listener automatically
   */
  initSerial(comName) {
    return new Promise((resolve, reject) => {
      this._closeSerialPort()
      .then(() => { return this._createSerialPort(comName); })
      .then(() => {
        resolve();
        console.log(`movuino connected @ serial port ${comName}`);
      })
      .catch((err) => {
        console.error('error opening serial port : ' + err.message);
      });
    });
  }

  //---------------------------- WIFI CONNECTION -----------------------------//

  attachUDPPort(udpPort, id = null) {
    return new Promise((resolve, reject) => {
      this.detachUDPPort();

      this.udpPort = udpPort;
      this.info.id = id || this.info.id;

      if (this.info.id === null) return;

      this.once('resolve', () => {
        this.info.udpPortReady = true;
        this.info.udpOnline = true;
        this.emit('info', this.info);
        resolve();
      }); // emitted by udpMessageListener

      this.udpListening = true;
      this.udpPort.on(`movuino-${this.info.id}`, this.udpMessageListener);
    });
  }

  detachUDPPort() {
    if (this.udpPort === null) return;

    if (this.udpListening) {
      this.udpPort.removeListener(this.udpMessageListener);
      this.udpListening = false;
    }

    this.info.udpPortReady = false;
    this.info.udpOnline = false;
    this.emit('info', this.info);

    clearInterval(this.udpInterval);
    this.udpInterval = null;
  }

  udpMessageListener({ address, args }, timeTag, info) {
    if (this.info.movuinoIP !== info.address) {
      this.info.movuinoIP = info.address;
      this.emit('info', this.info);
    }

    this.emit('osc', 'wifi', { address: address, args: args });
    this.emit('resolve');
  }

  /**
   * send an OSC message via wifi
   */
  send(message) {
    const msg = message.message;
    const suffix = stripMovuinoOSCPrefix(msg.address, this.info.id);

    if (suffix === null) {
      msg.address = `/movuino/${this.info.id}${msg.address}`;
    }

    if (message.medium === 'serial' && this.info.serialPortReady) {
      console.log(JSON.stringify(message, null, 2));
      this.serialPort.send(msg);
    } else if (message.medium === 'wifi' && this.info.udpPortReady) {
      this.udpPort.send(msg, this.info.movuinoIP, this.outputUDPPort);
    }
  }

  //=========================== SERIAL CONNECTION ============================//

  /**
   * Initialize a serial connection with a movuino and update its settings
   * during a serial handshake.
   * Resolve when handshake happened successfully.
   */
  _createSerialPort(comName) {
    return new Promise((resolve, reject) => {
      if (comName === null) return;

      //----------------------- create OSC serial port -----------------------//
      this.serialPort = new osc.SerialPort({
        devicePath: comName, 
        bitrate: 115200,
      });

      //------------------------- when port is ready -------------------------//
      this.serialPort.once('ready', () => {

        ////////// route and emit messages that are not hello
        this.serialPort.on('message', (message) => {
          const suffix = stripMovuinoOSCPrefix(message.address, this.info.id);

          if (suffix !== null) {
            // event emitter is here !!!!!!!!
            this.emit('osc', 'serial', { address: suffix, args: message.args});

            if (suffix === '/wifi/state' && message.args.length > 0) {
              this.info.wifiState = message.args[0];
              this.emit('info', this.info);
            } else if (suffix === '/wifi/set') {
              this._updateInfoFromSerial(message.args);
            }
          }
        });

        ////////// catch osc errors and simply ignore them
        this.serialPort.on('error', (err) => { /*console.log('osc error : ' + err.message);*/ });

        ////////// say hello, set ports and config, get wifi credentials        
        this.serialRpc('/hello', null, true)
        .then((hello) => {
          if (hello[0] === 'movuino') {
            this.info.id = hello[1];
            this.info.firmwareVersion = hello[2];
            this.info.wifiState = hello[3];
            this.info.movuinoIP = hello[4];
            return this.serialRpc('/ports/get');
          }          
        })
        .then((ports) => {
          const inputPort = config.dist.movuinoOSCServer.remotePort;
          const outputPort = config.dist.movuinoOSCServer.localPort;

          if (ports[0] !== inputPort || ports[1] !== outputPort) {
            return this.serialRpc('/ports/set', [
              { type: 'i', value: inputPort },
              { type: 'i', value: outputPort }
            ]);
          }

          return Promise.resolve();
        })
        // todo : try this
        // .then(this.serialRpc('/config/set', [ 1, 1, 20, 20, 500 ]))
        // .then(this.serialRpc('/wifi/get'))
        .then((ports) => {
          return this.serialRpc('/config/set', [
            { type: 'i', value: 1 }, // use serial (for sending sensors etc)
            { type: 'i', value: 1 }, // send single frame
            { type: 'i', value: 20 }, // readMagPeriod (not used)
            { type: 'i', value: 20 }, // outputFramePeriod (not used)
            { type: 'i', value: 500 } // button hold duration
          ]);
        })
        .then(() => { return this.serialRpc('/wifi/get'); })
        .then((credentials) => {
          ////////// if everything went well, emit all needed information and resolve
          // this.info.serialPortReady = true;
          // this.info.ssid = credentials[0];
          // this.info.password = credentials[1];
          // this.info.hostIP = credentials[2];
          // // this.emit('message', 'serial', { address: '/hello', args: info });
          // // this.emit('message', 'serial', { address: '/wifi/get', args: credentials });
          // this.emit('info', this.info);

          this._updateInfoFromSerial(credentials);
          resolve();
        });
      });

      this.serialPort.open();
    });
  }

  /**
   * Close the current serial connection.
   * Resolve when port is closed.
   */
  _closeSerialPort() {
    return new Promise((resolve, reject) => {
      if (this.serialPort !== null) {
        this.serialPort.removeAllListeners();

        const deinitSerial = () => {
          this.serialPort = null;
          this.info.serialPortReady = false;
          this.emit('info', this.info);
          resolve();
        }

        const closeListener = () => {
          console.log('normal close');
          deinitSerial();
        }

        const errorListener = (err) => {
          if (err.message === 'Port is not open') {
            console.log('port not open');
            this.serialPort.removeListener('close', closeListener);
            this.serialPort.removeListener('error', errorListener);
            deinitSerial();
          }
        }

        this.serialPort.once('close', closeListener);
        this.serialPort.on('error', errorListener); 

        this.serialPort.close();
      } else {
        resolve();
      }
    });   
  }

  _updateInfoFromSerial(credentials) {
    this.info.serialPortReady = true;
    this.info.ssid = credentials[0];
    this.info.password = credentials[1];
    this.info.hostIP = credentials[2];
    this.emit('info', this.info);
  }

  //============================== METHODS ===================================//

  serialRpc(address, args, raw = false) {
    return new Promise((resolve, reject) => {
      args = args || [];

      if (!raw) {
        address = `/movuino/${this.info.id}${address}`;
      }

      // const timeout = setTimeout(reject, 1000);
      const messageListener = message => {
        if (message.address !== address) {
          return;
        }

        resolve(message.args);
        this.serialPort.removeListener('message', messageListener);
        // clearTimeout(timeout);
      };

      this.serialPort.on('message', messageListener);
      this.serialPort.send({ address, args });
    });
  }
};

export default Movuino;