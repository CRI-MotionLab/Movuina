import { BrowserWindow, globalShortcut, remote, ipcMain as ipc } from 'electron';
import path from 'path';
import url from 'url';
import ejs from 'ejs';
import fs from 'fs-extra';

const cwd = process.cwd();
const distPath = path.join(__dirname, '../..');

const viewsPath = path.join(distPath, 'views');
const publicPath = path.join(distPath, 'public');

console.log(viewsPath);

class Renderer {
  constructor(config) {
    this.config = config;
    this.windows = {
      main: null,
      settings: null,
    };
  }

  createWindows() {
    const w = this.windows;

    if (w.main === null) {
      w.main = new BrowserWindow({width: 800, height: 600});

      const render = () => {
        const routes = this.config.dist.app.routes;
        // const templatePath = path.join(this.config.paths.viewsDist, routes.main.template) + '.ejs';
        const templatePath = path.join(viewsPath, routes.main.template) + '.ejs';

        ejs.renderFile(templatePath, routes.main.data, {}, function(err, res) {
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

      globalShortcut.register(process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', () => {
        // console.log('cmd+alt+I detected');
        w.main.webContents.send('cmd', 'toggledevtools');
      });

      ipc.on('cmd', (e, arg) => {
        if (arg === 'refresh' && w.main !== null) {
          render();
        }
      });

      w.main.webContents.on('did-finish-load', function() {
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