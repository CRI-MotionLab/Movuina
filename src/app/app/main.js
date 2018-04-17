import path from 'path'
import url from 'url';
import os from 'os';
import { app } from 'electron';
import serial from 'serialport';
import osc from 'osc';
import config from '../../config'; // this is just a copy of build/config/used_config.js

import {
  Renderer,
  LocalServer,
} from './core';

let ports = null;
let port = null;

// found here :
// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js

var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function(ifname) {
  ifaces[ifname].forEach(function(iface) {
    if (iface.family !== 'IPv4' || iface.internal !== false) {
      return;
    }

    console.log(ifname + ' : ' + iface.address); // this is my IP
  });
});

// local osc client / server

const udpOsc = new osc.UDPPort({
  localAddress: '127.0.0.1',
  localPort: 8000,
  remoteAddress: '127.0.0.1',
  remotePort: 9000,
});

//============================================================================//

const renderer = new Renderer(config);
const server = new LocalServer(config);

//--------------------------------------- serial stuff

renderer.on('serialport', (cmd, arg) => {
  console.log('renderer emitted ' + cmd + ' ' + arg);
  if (cmd === 'refresh') {
    serial.list()
    .then(p => {
      ports = p;
      renderer.send('serialport', 'ports', p);
    })
    .catch(err => {
      console.error(err);
    });
  } else if (cmd === 'port') {
    const p = ports[arg - 1];

    if (port) {
      console.log('closing current serial port');
      port.close(() => { if (arg > 0) { createPort(p.comName); }});
    } else {
      createPort(p.comName);
    }
  }
});

function createPort(name) {
  port = new serial(name, { baudRate: 115200 }, (err) => {
    // manage errors here
    if (err) {
      console.error(err);
    } else {
      console.log('opened serial port ' + name);
    }

  });
  port.on('data', function (data) {
    console.log('Data:', data.toString());
  });
  port.write('?\n');
}

//--------------------------------------- app stuff

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  renderer.createWindows();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // kill server, do
  renderer.deleteWindows();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  renderer.createWindows();
});


// this is for development only, to allow restarting electron on each
// project modification, but does no harm remaining here.
process.stdin.on('data', (msg) => {
  switch (msg.toString()) {
    case 'reload':
      // todo: reload app ?
      break;
    case 'quit':
      app.quit();
      break;
    case 'server:restart':
      // todo: restart server ?
      break;
    default:
      break;
  }
});
