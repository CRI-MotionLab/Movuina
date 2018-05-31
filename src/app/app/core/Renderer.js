import EventEmitter from 'events';
import path from 'path';
import url from 'url';

import ejs from 'ejs';
import fs from 'fs-extra';

import {
  BrowserWindow,
  globalShortcut,
  remote,
  ipcMain as ipc
} from 'electron';

import { getMyIP } from './util';

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
            this.send('renderer', 'getmyip', ip);
          }
        }
      });

      // this is how we capture Alt+Cmd+I shortcut to show the dev tools
      // even in production (packaged)

      globalShortcut.register(process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', () => {
        this.window.webContents.send('renderer', 'toggledevtools');
      });

      // find a way to forward all messages this way (or by renderer name channel)
      // => this seems to work fine

      const channels = [
        'serialport',
        'movuino',
        'oscserver',
      ];
      channels.forEach((channel) => {
        ipc.on(channel, (e, cmd, args) => {
          this.emit(channel, cmd, args);
        });
      });

      // window stuff

      this.window.webContents.on('did-finish-load', () => {
        // eventually do stuff here
      });

      this.window.on('close', (e) => {
        e.preventDefault();
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