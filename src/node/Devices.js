// import EventEmitter from 'events';
import { getMyIp } from './util';
import serial from './Devices/Serial';
import wifi from './Devices/Wifi';
import Movuino from './Devices/Movuino';
import localServer from './Devices/LocalServer';

import controller from './ViewController';
import config from '../config';

// TODO : serialize / deserialize a devices configuration

const normValues = {
  acc: 4, // 9.81,
  gyr: 1440, // 360,
}

const sensorNormRatios = {
  '/movuino': {
    acc: 16 * 0.5, // default acc sensibility is +/- 16g
    gyr: 2000 / normValues.gyr, // default gyr sensibility is +/- 2000 deg/sec
  },
  '/streamo': {
    acc: (1 / 9.81) * 0.5,
    gyr: 1 / normValues.gyr,
  },
};

class Devices {
  constructor() {
    // this.activeDevice = -1;
    // this.ports = [];
    // this.wifiConnections = [];
    // this.connectedPorts = [];
    // this.devices = new Map(); // map by index using freeindex list

    // this.freeIndexList = [];
    // this.busyIndexList = [];

    this.useSerialInput = true; // set to false when interface loads

    this._updateSerialPorts = this._updateSerialPorts.bind(this);
    this._onSerialOscInput = this._onSerialOscInput.bind(this);
    this._updateSerialSensorValues = this._updateSerialSensorValues.bind(this);
    this._processDevicesOscInput = this._processDevicesOscInput.bind(this);
    this._processLocalOscInput = this._processLocalOscInput.bind(this);

    this.movuino = new Movuino();

    this.movuino.on('settings', (settings) => {
      controller.send('updateMovuinoSettings', settings);
    });

    this.movuino.on('state', (state) => {
      controller.send('updateMovuinoState', state);
    });

    this.movuino.on('osc', this._onSerialOscInput);

    controller.addListener('loaded', () => serial.emitSerialPorts());
    controller.addListener('updateSerialPort', (port) => { this.initMovuino(port); });
    controller.addListener('updateUseSerialInput', (useSerialInput) => {
      if (useSerialInput && !this.useSerialInput) {
        wifi.removeListener('osc', this._processDevicesOscInput);
        this.movuino.on('osc', this._processDevicesOscInput);
      } else if (!useSerialInput && this.useSerialInput) {
        this.movuino.removeListener('osc', this._processDevicesOscInput);
        wifi.on('osc', this._processDevicesOscInput);
      }

      this.useSerialInput = useSerialInput;

    });
    controller.addListener('getMyIp', () => {
      controller.send('setMyIp', getMyIp());
    })
    controller.addListener('updateMovuinoSettings', this.movuino.updateSettings);
    controller.addListener('updateOutputDevicesOscFrame', (message) => {
      const args = [];

      for (let key in message.args) {
        if (`${parseInt(key)}` === key) {
          args.push(message.args[key]);
        }
      }

      this.sendOscMessage({
        address: message.address,
        args: args,
      });
    });
    controller.addListener('updateOutputLocalOscFrame', (frame) => {
      for (let key in frame) {
        localServer.send(frame[key]);
      }
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      serial.on('noSerialDriverInstalled', (url) => {
        controller.send('noSerialDriverInstalled', url);
      });
      serial.on('updateSerialPorts', this._updateSerialPorts);
      serial.emitSerialPorts();
      serial.startObservingSerialPorts();

      localServer.on('osc', this._processLocalOscInput);

      Promise.all([
        wifi.startObservingOSCMessages(),
        localServer.start(),
      ])
      .then(resolve)
      .catch((err) => { console.error(err.message); });
    });
  }

  stop() {
    serial.removeAllListeners();
    serial.stopObservingSerialPorts();

    wifi.removeAllListeners();
    wifi.stopObservingOSCMessages();

    localServer.stop();
  }

  initMovuino(comName) {
    this._updateSerialSensorValues([ 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
    this.movuino.initSerial(comName)
    .then(() => { return this.movuino.attachUDPPort(wifi.getUDPPort()); })
    .then(() => { console.log('wifi connected !')})
    .catch((err) => { console.error(err.message); });
  }

  sendOscMessage(message) {
    if (this.useSerialInput) {
      this.movuino.sendSerialOscMessage(message);
    } else {
      wifi.broadcastOscMessage(message);
    }
  }

  sendLocalOscMessage(message) {
    localServer.send(message);
  }

  //--------------------------------------------------------------------------//

  _updateSerialPorts(serialPorts = null) {
    this.serialPorts = serialPorts || this.serialPorts;
    controller.send('updateSerialPorts', this.serialPorts);
  }

  _onSerialOscInput(origin, { address, args }) {
    // no need to check serial origin here, as we know movuino only emits serial osc
    this._updateSerialSensorValues(args.slice(1));
  }

  _updateSerialSensorValues(values) {
    controller.send('updateSerialSensorValues', {
      accx: values[0],
      accy: values[1],
      accz: values[2],
      gyrx: values[3],
      gyry: values[4],
      gyrz: values[5],
      magx: values[6],
      magy: values[7],
      magz: values[8],
    });
  }

  _processDevicesOscInput(origin, { address, args }, timeTag, info) {
    const inputPort = config.movuinoOscServer.localPort;
    controller.send('updateInputDevicesOscFrame', {
      origin: (origin === 'wifi') ? `port ${inputPort}` : 'serial',
      address,
      name: args[0],
      // normalization of sensor values is performed here :
      accx: args[1] * sensorNormRatios[address].acc,
      accy: args[2] * sensorNormRatios[address].acc,
      accz: args[3] * sensorNormRatios[address].acc,
      gyrx: args[4] * sensorNormRatios[address].gyr,
      gyry: args[5] * sensorNormRatios[address].gyr,
      gyrz: args[6] * sensorNormRatios[address].gyr,
      magx: args[7],
      magy: args[8],
      magz: args[9],
      btn: args[10],
      vib: args[11],
    });
  }

  _processLocalOscInput({ address, args }) {
    const inputPort = config.localOscServer.localPort;

    // THIS IS DIRTY : IT WILL BREAK IF WE ADD NEW INPUT MODULES LIKE VIBRATOR !!!!!!!
    // TODO: FIND A CLEANER WAY TO FILTER LOCAL INPUT OSC FRAMES IN LOCALCONNECTION VUE MODULE
    controller.send('updateInputLocalOscFrame', { vibrator: {
      origin: `port ${inputPort}`,
      address: address,
      args: args,
    }});
  }

  /*
  addDevice() {
    const movuino = new Movuino();    
    const insertIndex = this.freeIndexList.length > 0
                      ? this.freeIndexList.pop() // removes index from freeIndexList
                      : this.devices.size;

    this.devices.set(insertIndex, movuino);
    this.busyIndexList.push(insertIndex); // adds index to busyIndexList

    movuino.on('settings', (settings) => {
      controller.send('updateMovuinoSettings', settings);
    });

    movuino.on('state', (state) => {
      controller.send('updateMovuinoState', state);
    })
    
    movuino.on('osc', (medium, message) => {
      this.emit('controller', 'osc', {
        from: 'movuino',
        medium: medium,
        device: insertIndex,
        id: movuino.info.id,
        message: message,
      });
    });

    // this.emit('controller', 'deviceList', this.busyIndexList);
    return insertIndex;
  }

  removeDevice(index) {
    if (this.devices.has(index)) {
      const movuino = this.devices.get(index);
      movuino.removeAllListeners();
      movuino.closeSerialPort();
      movuino.detachUDPPort();
      this.devices.delete(index);

      this.freeIndexList.push(index);

      const i = this.busyIndexList.indexOf(index);
      this.busyIndexList.splice(i, 1);

      this.emit('controller', 'deviceList', this.busyIndexList);

      if (index === this.activeDevice) {
        const activeDevice = i < this.busyIndexList.length
                           ? this.busyIndexList[i]
                           : this.busyIndexList[this.busyIndexList.length - 1];

        // this.emit('controller', 'activeDevice', activeDevice);
      }
    }
  }

  setActiveDevice(index) {
    if (this.devices.has(index)) {
      this.activeDevice = index;
    }
  }

  attachDevice(movuinoId) {
    const movuino = this.devices.get(this.activeDevice);
    movuino.attachUDPPort(wifi.getUDPPort(), movuinoId);
  }

  initDevice(comName) {
    if (this.activeDevice > -1) {
      const movuino = this.devices.get(this.activeDevice);
      movuino.initSerial(comName)
      .then(() => { return movuino.attachUDPPort(wifi.getUDPPort()); }) // should have been set by initSerial
      .then(() => { console.log('wifi connected !')})
      .catch((err) => { console.error(err.message); });
    }
  }
  /*/
};

export default Devices;