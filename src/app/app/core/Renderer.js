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

// root path, here 'src', once transpiled 'dist'
const distPath = path.join(__dirname, '../../..');

const viewsPath = path.join(distPath, 'views');
const publicPath = path.join(distPath, 'public');

class Renderer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.window = null;
  }

  send(channel, cmd, arg) {
    this.window.webContents.send(channel, cmd, arg);
  }

  createWindow() {
    let w = this.window;

    if (this.window === null) {
      this.window = new BrowserWindow({ width: 800, height: 600 });
      // w.main.maximize();

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

      ipc.on('serialport', (e, cmd, arg) => {
        this.emit('serialport', cmd, arg);
      });

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