import path from 'path'
import { app, Menu } from 'electron';

import {
  AppMenu,
  Devices,
  LocalServer,
  MachineLearning,
  ViewController,
} from './core';

// view controller is the central communication hub between core and interface
// it routes all osc messages to the connection displays
const controller = new ViewController();
const devices = new Devices();
const localServer = new LocalServer();
const machineLearning = new MachineLearning();

// single device version
devices.setActiveDevice(devices.addDevice());


devices.on('controller', function(cmd, arg) { // target: controller
  controller.send('devices', cmd, arg); // source: devices
});

localServer.on('controller', function(cmd, arg) { // target: controller
  controller.send('localServer', cmd, arg); // source: localServer
});

controller.on('devices', function(cmd, arg) {
  devices.executeCommand('controller', cmd, arg);
});

controller.on('localServer', function(cmd, arg) {
  localServer.executeCommand('controller', cmd, arg);
});

controller.on('machineLearning', function(cmd, arg) {
  machineLearning.executeCommand('controller', cmd, arg);
});

machineLearning.on('controller', function(cmd, arg) {
  controller.send('machineLearning', cmd, arg);
})

//========================== APP SPECIFIC STUFF ==============================//

AppMenu.on('device', (cmd, args) => {
  controller.send('menu', 'device', cmd, args);
});

AppMenu.on('showOSCConnections', (show) => {
  controller.send('menu', 'showOSCConnections', show);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const menu = Menu.buildFromTemplate(AppMenu.getMenuTemplate());
  Menu.setApplicationMenu(menu);

  controller.createWindow();

  controller.on('loaded', () => {
    AppMenu.initMenu(menu);
  });

  controller.once('loaded', () => {
    Promise.all([ devices.start(), localServer.start() ])
    .then(() => {
      // console.log('everybody started successfully');
    })
    .catch((err) => console.error(err.message));
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  devices.stop();
  localServer.stop();
  controller.deleteWindow();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  controller.createWindow();
});

//----------------------------------------------------------------------------//

// this is for development only, to allow restarting electron on each
// project modification, but does no harm remaining here.
process.stdin.on('data', (msg) => {
  switch (msg.toString()) {
    case 'reload':
      // todo: reload app ?
      break;
    case 'quit':
      console.log('calling app.quit()');
      app.quit();
      break;
    case 'server:restart':
      // todo: restart server ?
      break;
    default:
      break;
  }
});
