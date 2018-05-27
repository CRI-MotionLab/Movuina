import path from 'path'
import url from 'url';
import { app } from 'electron';
import osc from 'osc';
import config from '../../config'; // this is just a copy of build/config/<used_config_name>.js

import {
  Serial,
  Renderer,
  WebServer,
  OSCServer,
} from './core';

const serial = new Serial(config);
const renderer = new Renderer(config);
const webServer = new WebServer(config);
const oscServer = new OSCServer(config);

//--------------------------------------- serial <> renderer communication

renderer.on('serialport', (cmd, arg) => { // 'refresh' or 'ports'
  serial.executeSerialCommand(cmd, arg);
});

renderer.on('movuino', (cmd, arg) => {
  serial.executeMovuinoCommand(cmd, arg);
});

serial.on('ports', p => {
  renderer.send('serialport', 'ports', p)
});

serial.on('movuino', (cmd, args) => {
  renderer.send('movuino', cmd, args);
});

renderer.on('oscserver', (cmd, args) => {
  oscServer.executeCommand(cmd, args);
});

oscServer.on('oscmessage', (cmd, args) => {
  renderer.send('oscmessage', cmd, args);
});

//--------------------------------------- app stuff

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', () => {
  renderer.createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // kill server, do
  renderer.deleteWindow();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  renderer.createWindow();
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
