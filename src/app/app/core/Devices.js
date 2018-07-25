import EventEmitter from 'events';
import serial from './Serial';
import wifi from './WiFi';
import Movuino from './Movuino';

// TODO : serialize / deserialize a devices configuration

class Devices extends EventEmitter {
  constructor() {
    super();

    this.activeDevice = -1;
    this.ports = [];
    this.wifiConnections = [];
    this.connectedPorts = [];
    this.devices = new Map(); // map by index using freeindex list

    this.freeIndexList = [];
    this.busyIndexList = [];

    this._updateSerialPorts = this._updateSerialPorts.bind(this);
    this._updateWiFiConnections = this._updateWiFiConnections.bind(this);
    this._processWiFiOSCInput = this._processWiFiOSCInput.bind(this);
  }

  start() {
    return new Promise((resolve, reject) => {
      serial.on('serialPorts', this._updateSerialPorts);
      serial.on('noDriverInstalled', () => { this.emit('controller', 'noDriverInstalled'); });
      serial.startObservingSerialPorts();

      wifi.on('wifiConnections', this._updateWiFiConnections);
      wifi.on('osc', this._processWiFiOSCInput);
      wifi.startObservingOSCMessages()
      .then(resolve)
      .catch((err) => { console.error(err.message); });
    });
  }

  stop() {
    serial.removeAllListeners();
    serial.stopObservingSerialPorts();

    wifi.removeAllListeners();
    wifi.stopObservingOSCMessages();
  }

  executeCommand(origin, cmd, arg) {
    if (origin === 'controller') {
      const movuino = this.devices.get(this.activeDevice);

      switch (cmd) {
        case 'getSerialPorts':
          this._updateSerialPorts();
          break;
        case 'serialPort':
          this.initDevice(arg); // comName
          break;
        case 'getWiFiConnections':
          this._updateWiFiConnections();
          break;
        case 'wifiConnection':
          movuino.attachUDPPort(arg); // id
          break;
        case 'activeDevice':
          this.activeDevice = arg; // device number
          this.emit('controller', 'info', movuino.getInfo());
          break;
        case 'osc':
          this.devices.get(this.activeDevice).send(arg);
          break;
        default:
          break;
      }
    }
  }

  addDevice() {
    const movuino = new Movuino();    
    const insertIndex = this.freeIndexList.length > 0
                      ? this.freeIndexList.pop() // removes index from freeIndexList
                      : this.devices.size;

    this.devices.set(insertIndex, movuino);
    this.busyIndexList.push(insertIndex); // adds index to busyIndexList

    movuino.on('info', (info) => {
      this.emit('controller', 'info', {
        device: insertIndex,
        info: info
      });
    });
    
    movuino.on('osc', (medium, message) => {
      this.emit('controller', 'osc', {
        from: 'movuino',
        medium: medium,
        device: insertIndex,
        id: movuino.info.id,
        message: message,
      });
    });

    this.emit('controller', 'deviceList', this.busyIndexList);
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

        this.emit('controller', 'activeDevice', activeDevice);
      }
    }
  }

  setActiveDevice(index) {
    if (this.devices.has(index)) {
      this.activeDevice = index;
    }
  }

  initDevice(comName) {
    if (this.activeDevice > -1) {
      const movuino = this.devices.get(this.activeDevice);
      movuino.initSerial(comName)
      .then(() => { return movuino.attachUDPPort(wifi.getUDPPort()); }) // id should have been set by initSerial
      .then(() => { console.log('wifi connected !')})
      .catch((err) => { console.error(err.message); });
    }
  }

  attachDevice(movuinoId) {
    const movuino = this.devices.get(this.activeDevice);
    movuino.attachUDPPort(wifi.getUDPPort(), movuinoId);
  }

  getSerialPorts() {
    return this.serialPorts;
  }

  getWiFiConnections() {
    return this.wifiConnections;
  }

  //--------------------------------------------------------------------------//

  _updateSerialPorts(serialPorts = null) {
    this.serialPorts = serialPorts || this.serialPorts;
    this.emit('controller', 'serialPorts', this.serialPorts);
  }

  _updateWiFiConnections(wifiConnections = null) {
    this.wifiConnections = wifiConnections || this.wifiConnections;
    this.emit('controller', 'wifiConnections', this.wifiConnections);
  }

  _processWiFiOSCInput({ id, suffix, args }, timeTag, info) {
    // do something
    // if (this.devices.get(this.activeDevice).getId() === id) {
    //   this.emit('controller', 'osc', { address: `/movuino/${id}${suffix}` });
    // }
  }
};

export default Devices;