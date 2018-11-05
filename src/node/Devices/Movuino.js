import EventEmitter from 'events';
import osc from 'osc';

import config from '../../config';

//============================= MOVUINO CLASS ================================//

class Movuino extends EventEmitter {
  constructor(id = null) {
    super();

    this.info = {
      id: null,
      movuinoid: id,
      firmwareVersion: null,
      ssid: '',
      password: '',
      hostip: '0.0.0.0',
      name: '',
      movuinoip: '0.0.0.0',
      wifiState: 0,
      useSerial: false,
      serialPortReady: false,
      // udpPortReady: false,
      // udpOnline: false,
    };

    this.serialPort = null;

    this.udpPort = null;
    this.udpInterval = null;
    this.udpListening = false;
    this.lastUDPMessageDate = 0;
    this.udpTimeoutDuration = 1000;
    this.outputUDPPort = config.movuinoOscServer.remotePort;

    this.updateSettings = this.updateSettings.bind(this);
    
    this._udpMessageListener = this._udpMessageListener.bind(this);
    this._createSerialPort = this._createSerialPort.bind(this);
    this._closeSerialPort = this._closeSerialPort.bind(this);
    this._serialRpc = this._serialRpc.bind(this);
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

  sendSerialOscMessage(message) {
    if (this.serialPort !== null) {
      this.serialPort.send(message);
    }
  }

  updateSettings(settings) {
    this.detachUDPPort();
    Object.assign(this.info, settings);

    return new Promise((resolve, reject) => {
      if (this.serialPort !== null) {
        this._serialRpc('/wifi/set', [
          { type: 's', value: this.info.ssid },
          { type: 's', value: this.info.password },
          { type: 's', value: this.info.hostip },
        ])
        .then(() => {
          return this._serialRpc('/id/set', [
            { type: 's', value: this.info.name },
          ]);
        })
        .then(() => {
          this.attachUDPPort(); // this regenerates new id to route incoming wifi
          resolve();
        });
      }
    });
  }

  //---------------------------- WIFI CONNECTION -----------------------------//

  attachUDPPort(udpPort, id = null) {
    return new Promise((resolve, reject) => {
      this.detachUDPPort();

      this.udpPort = udpPort || this.udpPort;
      this.info.movuinoid = id || this.info.movuinoid;

      if (this.info.movuinoid === null) return;

      this.once('resolve', () => {
        resolve();
      }); // emitted by _udpMessageListener

      this.udpListening = true;

      this.id = this.info.name;
      this.id += `@${this.info.movuinoip}`;
      this.id += `:${config.movuinoOscServer.remotePort}`;

      this.udpPort.on(this.id, this._udpMessageListener);

      this.lastUDPMessageDate = Date.now();
      this.udpInterval = setInterval(() => {
        if (Date.now() - this.lastUDPMessageDate > this.udpTimeoutDuration &&
            this.info.wifiState === 1) {
          this.info.wifiState = 0;
          this.emit('state', { wifiState: this.info.wifiState });

          if (!this.info.serialPortReady) {
            this.detachUDPPort();
          }
        }
      }, this.udpTimeoutDuration * 0.5);
    });
  }

  detachUDPPort() {
    if (this.udpPort === null) return;

    if (this.udpListening) {
      this.udpPort.removeListener(this.id, this._udpMessageListener);
      this.udpListening = false;
    }

    clearInterval(this.udpInterval);
    this.udpInterval = null;
  }

  _udpMessageListener({ address, args }, timeTag, info) {
    if (this.info.movuinoip !== info.address) {
      this.info.movuinoip = info.address;
      this.emit('state', { movuinoip: this.info.movuinoip });
    }

    this.lastUDPMessageDate = Date.now();
    if (this.info.wifiState !== 1) {
      this.info.wifiState = 1;
      this.emit('state', { wifiState: this.info.wifiState });
    }

    this.emit('resolve'); // used to resolve udp connection in attachUDPPort
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

          //--------------------------------------------------------------------
          if (message.address === '/movuino') {
            this.emit('osc', 'serial', { address: message.address, args: message.args});
          //--------------------------------------------------------------------
          } else if (message.address === '/wifi/state' && message.args.length > 0) {
            this.info.wifiState = message.args[0];
            if (this.info.wifiState === 1) {
              // when wifiState becomes 1, we need to check the new ip address
              this._serialRpc('/hello')
              .then((hello) => {
                // this.info.name = hello[1];
                this.info.movuinoip = hello[3];
                return this.attachUDPPort();
              })
              .then(() => {
                this.emit('state', {
                  wifiState: this.info.wifiState,
                  movuinoip: this.info.movuinoip,
                });
              });
            } else {
              this.emit('state', { wifiState: this.info.wifiState });
            }
          //--------------------------------------------------------------------
          } else if (message.address === '/wifi/set' && message.args.length > 3) {
            this.info.ssid = message.args[0];
            this.info.password = message.args[1];
            this.info.hostip = message.args[2];

            this.emit('settings', {
              ssid: this.info.ssid,
              password: this.info.password,
              hostip: this.info.hostip,
            });
          }
        });

        ////////// catch osc errors and simply ignore them
        this.serialPort.on('error', (err) => { console.log('osc error : ' + err.message); });

        ////////// say hello, set ports and config, get wifi credentials        
        this._serialRpc('/hello')
        .then((hello) => {
          console.log(hello);
          if (hello[0] === 'movuino') {
            this.info.name = hello[1];
            this.info.wifiState = hello[2];
            this.info.movuinoip = hello[3];
            this.info.movuinoid = hello[4];
            this.info.firmwareVersion = hello[5];
            return this._serialRpc('/ports/get');
          }          
        })
        .then((ports) => {
          const inputPort = config.movuinoOscServer.remotePort;
          const outputPort = config.movuinoOscServer.localPort;

          if (ports[0] !== inputPort || ports[1] !== outputPort) {
            return this._serialRpc('/ports/set', [
              { type: 'i', value: inputPort },
              { type: 'i', value: outputPort },
            ]);
          }

          return Promise.resolve();
        })
        .then(() => {
          return this._serialRpc('/range/set', [
            { type: 'i', value: config.movuinoSettings.accelRange }, // +/- 16g // * 9.81 / 16
            { type: 'i', value: config.movuinoSettings.gyroRange }, // +/- 2000 deg/sec // * 36 / 200
          ]);
        })
        .then(() => { return this._serialRpc('/serial/enable', [{ type: 'i', value: 1 }]); })
        .then(() => { return this._serialRpc('/magneto/enable', [{ type: 'i', value: 1 }]); })
        .then(() => { return this._serialRpc('/frameperiod/set', [{ type: 'i', value: 10 }]); })
        .then(() => { return this._serialRpc('/wifi/get'); })
        .then((credentials) => {
          ////////// if everything went well, emit all needed information and resolve
          this.info.ssid = credentials[0];
          this.info.password = credentials[1];
          this.info.hostip = credentials[2];

          this.info.serialPortReady = true;

          this.emit('settings', {
            ssid: this.info.ssid,
            password: this.info.password,
            hostip: this.info.hostip,
            name: this.info.name
          });

          this.emit('state', {
            serialPortReady: this.info.serialPortReady,
            wifiState: this.info.wifiState,
            movuinoip: this.info.movuinoip,
          });

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

          if (this.info.wifiState === 2) {
            this.info.wifiState = 0;
            this.detachUDPPort();
          }

          this.emit('state', {
            serialPortReady: this.info.serialPortReady,
            wifiState: this.info.wifiState,
          });
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

  //============================== METHODS ===================================//

  _serialRpc(address, args) {
    return new Promise((resolve, reject) => {
      args = args || [];

      // const timeout = setTimeout(reject, 1000);
      const messageListener = message => {
        console.log(message.address);
        if (message.address !== address) {
          return;
        }

        resolve(message.args);
        this.serialPort.removeListener('message', messageListener);
        // clearTimeout(timeout);
      };

      this.serialPort.on('message', messageListener);
      console.log('sending ' + address + ' ' + args);
      this.serialPort.send({ address, args });
    });
  }
};

export default Movuino;