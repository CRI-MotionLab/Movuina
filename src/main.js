import Vue from 'vue/dist/vue.js';
import path from 'path'
import { app, Menu, ipcMain as ipc } from 'electron';
import { handleSquirrelEvent } from './node/util';
import AppMenu from './node/AppMenu';
import controller from './node/ViewController';
import Devices from './node/Devices';
import Modules from './node/Modules';

if (require('electron-squirrel-startup')) app.quit();
if (handleSquirrelEvent(app)) app.quit();

// view controller is the central communication hub between core and interface
// it routes all osc messages to the connection displays
// const controller = new ViewController();
const devices = new Devices();
const modules = new Modules();

// single device version
// devices.setActiveDevice(devices.addDevice());

AppMenu.on('device', (cmd, args) => {
  // controller.send('menu', 'device', cmd, args);
});

AppMenu.on('showOscConnections', (show) => {
  controller.send('showOscConnections', show);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const menu = Menu.buildFromTemplate(AppMenu.getMenuTemplate());
  Menu.setApplicationMenu(menu);

  controller.createWindow();
  
  ipc.on('loaded', () => {
    AppMenu.initMenu(menu);
  });

  ipc.once('loaded', () => {
    devices.start()
    .then(() => {
      console.log('everybody started successfully');
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
  // localServer.stop();
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
      // console.log('calling app.quit()');
      app.quit();
      break;
    case 'server:restart':
      // todo: restart server ?
      break;
    default:
      break;
  }
});
