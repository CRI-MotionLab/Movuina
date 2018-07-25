import EventEmitter from 'events';
import serial from 'serialport';
import fs from 'fs-extra';

// this is just a copy of build/config/<used_config_name>.js
// <used_config_name> is "default" by default
// it can be provided as an extra argument to "npm run [watch/build]"
import config from '../../../config';

//----------------------------------------------------------------------------//

const MOVUINO_VENDOR_ID = "10c4";
const MOVUINO_PRODUCT_ID = "ea60";

function isMovuino({ vendorId = "", productId = "" }) {
  return (
    vendorId.toLowerCase() === MOVUINO_VENDOR_ID &&
    productId.toLowerCase() === MOVUINO_PRODUCT_ID
  );
}

function listMovuinos() {
  return new Promise((resolve, reject) => {
    serial.list().then((devices) => {
      resolve(devices.filter(device => isMovuino(device)));
    })
  });
}

function checkIfPortsListChanged(prevList, newList) {
  if (prevList.length !== newList.length) return true;

  let cnt = 0;

  for (let i = 0; i < prevList.length; ++i) {
    for (let j = 0; j < newList.length; ++j) {
      if (prevList[i].comName === newList[j].comName) {
        cnt++;
        break;
      }
    }
  }

  return (cnt !== newList.length);
}

//----------------------------------------------------------------------------//

function checkIfDriverIsInstalled() {
  let driverIsInstalled = true;

  // not necessary to check in windows (?)
  // todo : check for linux
  if (process.platform === 'darwin') {
    driverIsInstalled = false;
    let files = fs.readdirSync('/System/Library/Extensions');
    files = files.concat(fs.readdirSync('/Library/Extensions'));

    for (let i = 0; i < files.length; ++i) {
      if (files[i].indexOf('SiLabsUSBDriver') !== -1) {
        driverIsInstalled = true;
        break;
      }
    }
  }

  return driverIsInstalled;
};

//----------------------- static vars for Serial class -----------------------//

let ports = [];
let interval = null;

//----------------------------------------------------------------------------//

class Serial extends EventEmitter {
  constructor() {
    super();
  }

  startObservingSerialPorts() {
    if (!checkIfDriverIsInstalled()) {
      this.emit('noDriverInstalled', config.dist.drivers.downloadUrl);
    }

    interval = setInterval(() => {
      listMovuinos().then((p) => {
        if (checkIfPortsListChanged(ports, p)) {
          ports = p;
          this.emit('serialPorts', p);
        }
      });
    }, 500);
  }

  stopObservingSerialPorts() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }
};

const instance = new Serial();

export default instance;