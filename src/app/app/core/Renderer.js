import EventEmitter from 'events';
import path from 'path';
import url from 'url';
import os from 'os';

import ejs from 'ejs';
import fs from 'fs-extra';

import {
  BrowserWindow,
  globalShortcut,
  remote,
  ipcMain as ipc
} from 'electron';

// found here :
// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js

const getMyIP = () => {
  let res = null;
  var ifaces = os.networkInterfaces();

  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function(iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        return;
      }

      res = iface.address;
      console.log(ifname + ' : ' + iface.address); // this is my IP
    });
  });

  return res;
};

//============================================================================//

// root path, here 'src', once transpiled 'dist'
const distPath = path.join(__dirname, '../../..');

const viewsPath = path.join(distPath, 'views');
const publicPath = path.join(distPath, 'public');

class Renderer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.window = null;
    // this.windows = {
    //   main: null, devices: null, oscSettings: null, settings: null
    // };
  }

  send(channel, cmd, arg) {
    if (this.window !== null) {
      this.window.webContents.send(channel, cmd, arg);
    }
  }

  createWindow() {
    let w = this.window;

    if (this.window === null) {
      this.window = new BrowserWindow({ width: 800, height: 600 });
      // this.window.webContents.openDevTools()

      //=========================== render function ==========================//

      const render = () => {
        const routes = this.config.dist.app.routes;
        const templatePath = path.join(viewsPath, routes.main.template) + '.ejs';

        ejs.renderFile(templatePath, routes.main.data, {}, (err, res) => {
          if (err !== null) {
            console.error(err);
          } else {
            // see : https://github.com/electron/electron/issues/1146
            this.window.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(res), {
              baseURLForDataURL: `file://${publicPath}`
            });
          }
        });
      };

      render();

      ipc.on('renderer', (e, arg) => {
        if (arg === 'refresh' && this.window !== null) {
          render();
        } else if (arg === 'getmyip') {
          const ip = getMyIP();
          if (ip !== null) {
            // console.log(ip);
            this.send('renderer', 'getmyip', ip);
          }
        // } else if (arg === 'getmovuinoip') {
        //   this.emit('movuino', 'address?');
        }
      });

      // this is how we capture Alt+Cmd+I shortcut to show the dev tools
      // even in production (packaged)

      globalShortcut.register(process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', () => {
        this.window.webContents.send('renderer', 'toggledevtools');
      });

      // find a way to forward all messages this way (or by renderer name channel)
      // ipc.on('data', (e, ...args) => {
      //   console.log(e);
      //   console.log(args);
      // });

      const channels = [ 'serialport', 'movuino', 'oscserver' ];

      channels.forEach((channel) => {
        ipc.on(channel, (e, cmd, arg) => {
          this.emit(channel, cmd, arg);
        });
      });

      /*
      ipc.on('serialport', (e, cmd, arg) => {
        this.emit('serialport', cmd, arg);
      });

      ipc.on('movuino', (e, cmd, arg) => {
        this.emit('movuino', cmd, arg);
      });

      ipc.on('oscserver', (e, cmd, arg) => {
        this.emit('oscserver', cmd, arg);
      });
      //*/

      this.window.webContents.on('did-finish-load', () => {
        // eventually do stuff here
      });

      this.window.on('closed', () => {
        this.window = null;
      });
    }
  }

  deleteWindow() {
    if (this.window !== null) {
      this.window.removeAllListeners('close');
      this.window = null;
    }
  }
};

export default Renderer;