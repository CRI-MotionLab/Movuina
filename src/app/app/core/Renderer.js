import {
  BrowserWindow,
  globalShortcut,
  remote,
  ipcMain as ipc
} from 'electron';

import EventEmitter from 'events';
import path from 'path';
import url from 'url';

import ejs from 'ejs';
import fs from 'fs-extra';

// root path, here 'src', once transpiled 'dist'
// const cwd = process.cwd();
// console.log(cwd);
const distPath = path.join(__dirname, '../../..');

const viewsPath = path.join(distPath, 'views');
const publicPath = path.join(distPath, 'public');

class Renderer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.windows = {
      main: null,
      settings: null,
    };
  }

  on(...args) {
    return super.on(...args);
  }

  emit(...args) {
    return super.emit(...args);
  }

  send(channel, cmd, arg) {
    this.windows.main.webContents.send('serialport', cmd, arg);
  }

  createWindows() {
    const w = this.windows;

    if (w.main === null) {
      w.main = new BrowserWindow({width: 800, height: 600, //});
      webPreferences: {
        nodeIntegration: true,
      }});

      // w.main = new BrowserWindow();
      // w.main.maximize();

      const render = () => {
        const routes = this.config.dist.app.routes;
        const templatePath = path.join(viewsPath, routes.main.template) + '.ejs';

        ejs.renderFile(templatePath, routes.main.data, {}, (err, res) => {
          if (err !== null) {
            console.error(err);
          } else {
            // see : https://github.com/electron/electron/issues/1146
            w.main.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(res), {
              baseURLForDataURL: `file://${publicPath}`
            });
          }
        });
      };

      render();

      ipc.on('renderer', (e, arg) => {
        console.log(arg);
        if (arg === 'refresh' && w.main !== null) {
          console.log('refreshing');
          render();
        }
      });

      // this is how we catch (and keep) Alt+Cmd+I shortcut to show the dev tools
      // even in production (packaged)
      globalShortcut.register(process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', () => {
        console.log('devtools shortcut caught');
        w.main.webContents.send('renderer', 'toggledevtools');
      });

      // find a way to forward all messages this way (or by renderer name channel)
      // ipc.on('data', (e, ...args) => {
      //   console.log(e);
      //   console.log(args);
      // });

      ipc.on('serialport', (e, cmd, arg) => {
        this.emit('serialport', cmd, arg);
      });

      w.main.webContents.on('did-finish-load', () => {
        // do stuff
        // w.main.webContents.evaluate('<!DOCTYPE html><html><head></head> <body> <h1>AHA !</h1> </body></html>');
        // w.main.webContents.reload();
      });

      w.main.on('closed', () => {
        w.main = null;
      });
    }
  }

  deleteWindows() {
    for (let w in this.windows) {
      if (this.windows[w] !== null) {
        this.windows[w].removeAllListeners('close');
        this.windows[w] = null;
      }
    }
  }
};

export default Renderer;