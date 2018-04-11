import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
// import fs = from 'fs-extra';

// Keep a global reference of the window objects, if you don't, the windows will
// be closed automatically when the JavaScript object is garbage collected.
// const windows = {};
const cwd = process.cwd();

class Renderer {
  constructor(config) {
    this.config = config;
    this.windows = {
      main: null,
      settings: null,
    };
  }

  createWindows() {
    const prefix = this.config.publicDir;
    const mainRoute = this.config.routes.main;
    const w = this.windows;
    // console.log(prefix);
    // console.log(mainRoute.route);

    if (w.main === null) {
      w.main = new BrowserWindow({width: 800, height: 600});

      const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" type="text/css" href="css/main.css">
      </head>
      <body>
        <p> AHA ! </p>
      </body>
      </html>`;

      /*
      // found here :
      // https://github.com/electron/electron/issues/1146

      w.main.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(htmlString), {
        baseURLForDataURL: `file://${__dirname}/../../public/`
        // baseURLForDataURL: `file://${config.path}/../../public/`
      });
      //*/

      //*
      w.main.loadURL(url.format({
        // pathname: path.join(__dirname, prefix, mainRoute.route, 'index.html'),
        pathname: path.join(__dirname, '../../index.html'),
        // pathname: path.join(cwd, prefix, mainRoute.route, 'index.html'),
        // pathname: '../index.html',
        protocol: 'file:',
        slashes: true,
        // baseUrl: 'public',
      }));
      //*/

      w.main.webContents.on('did-finish-load', function() {
        // do stuff
        // w.main.webContents.evaluate('<!DOCTYPE html><html><head></head> <body> <h1>AHA !</h1> </body></html>');
        // w.main.webContents.reload();
      });

      // Open the DevTools.
      // w.main.webContents.openDevTools();

      w.main.on('closed', () => {
        w.main = null;
      });
    }

    /*
    if (w.settings === null) {
      w.settings = new BrowserWindow({width: 200, height: 200});

      w.settings.loadURL(url.format({
        pathname: path.join(cwd, 'public/index.html'),
        protocol: 'file:',
        slashes: true,
      }));

      w.settings.on('closed', () => {
        w.settings = null;
      });
    }
    //*/
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