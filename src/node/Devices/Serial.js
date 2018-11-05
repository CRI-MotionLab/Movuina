import EventEmitter from 'events';
import serial from 'serialport';
import path from 'path';
import fs from 'fs-extra';

import config from '../../config';

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
  if (process.platform === 'darwin') {
    let files = fs.readdirSync('/System/Library/Extensions');
    files = files.concat(fs.readdirSync('/Library/Extensions'));

    for (let i = 0; i < files.length; ++i) {
      if (files[i].indexOf('SiLabsUSBDriver') !== -1) {
        return true;
      }
    }

    return false;
  }

  if (process.platform === 'win32') {
    fs.stat('c:\\Windows\\System32\\drivers\\silabser.sys', function(err, stat) {
      return err === null;
    });
  }

  // todo : check for linux
  return true;
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
      this.emit('noSerialDriverInstalled', config.drivers.downloadPageUrl);
    }

    interval = setInterval(() => {
      listMovuinos().then((p) => {
        if (checkIfPortsListChanged(ports, p)) {
          ports = p;
          this.emit('updateSerialPorts', p);
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

  emitSerialPorts() {
    this.emit('updateSerialPorts', ports);
  }
};

const instance = new Serial();

export default instance;