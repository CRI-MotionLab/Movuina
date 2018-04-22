import EventEmitter from 'events';
import serial from 'serialport';

class Serial extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.port = null;
    this.ports = null;
    this.receiving = false;
    this.message = '';
  }

  executeMovuinoCommand(cmd, arg) {
    if (!this.port) return;

    // using the provided firmware, messages must be formatted like this :
    // STX<cmd_str>STX<arg1_str>STX<arg2_str>...<argn_str>ETX
    // before they are sent to serial port.
    // STX and ETX are "start text" and "end text" (non printable) characters,
    // and are obtained via String.fromCharCode(2) and String.fromCharCode(3),
    // respectively.
    // see ASCII table for more info.

    let message = String.fromCharCode(2) + cmd;

    if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        message += String.fromCharCode(2) + arg[i];
      }
    } else {
      message += String.fromCharCode(2) + arg;
    }

    message += String.fromCharCode(3);
    this.port.write(message);
  }

  executeSerialCommand(cmd, arg) {
    if (cmd === 'refresh') {
      serial.list()
      .then(p => {
        this.ports = p;
        this.emit('ports', p);
      })
      .catch(err => {
        console.error(err);
      });
    } else if (cmd === 'port') {
      const p = this.ports[arg - 1];

      if (this.port) {
        console.log('closing current serial port');
        this.port.close(() => {
          this.port = null;

          if (arg > 0) {
            this._createPort(p);
          }
        });
      } else {
        this._createPort(p);
      }
    }
  }

  _createPort(p) {
    this.port = new serial(p.comName, { baudRate: 115200 }, (err) => {
      // manage errors here
      if (err) {
        console.error(err);
      } else {
        console.log('opened serial port :');
        console.log(p);
        this.executeMovuinoCommand('settings!', [ 'me', 'XXXX-147e', 'password', '192.168.0.2', '9000', '9001' ]);
      }
    });

    this.port.on('data', (data) => {
      this._parseMovuinoData(data.toString());
    });
  }

  _parseMovuinoData(str) {
    for (let i = 0; i < str.length; i++) {
      if (this.receiving) {
        if (str.charCodeAt(i) === 3) {
          this.receiving = false;
          const cmd = this.message.split(String.fromCharCode(2));
          this._processMovuinoData(cmd.splice(0, 1), cmd);
          this.message = '';
        } else {
          this.message += str.charAt(i);
        }
      } else {
        if (str.charCodeAt(i) === 2) {
          this.receiving = true;
        }
      }
    }
  }

  _processMovuinoData(cmd, args) {
    console.log('received movuino message');
    console.log('command : ' + cmd);
    console.log('args : ' + args);
  }
};

export default Serial;