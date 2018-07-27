import EventEmitter from 'events';
import path from 'path';
import url from 'url';

import ejs from 'ejs';
import fs from 'fs-extra';

import {
  screen,
  BrowserWindow,
  globalShortcut,
  remote,
  ipcMain as ipc
} from 'electron';

import {
  getMyIP,
  stripMovuinoOSCPrefix,
  createExcelDocFromRecording,
} from './util';

// this is just a copy of build/config/<used_config_name>.js
// <used_config_name> is "default" by default
// it can be provided as an extra argument to "npm run [watch/build]"
import config from '../../../config';

//============================================================================//

// root path, here 'src', once transpiled 'dist'
const distPath = path.join(__dirname, '../../..');

const viewsPath = path.join(distPath, 'views');
const publicPath = path.join(distPath, 'public');

class ViewController extends EventEmitter {
  constructor() {
    super();
    this.info = null;
    this.window = null;
    this.render = this.render.bind(this);
  }

  createWindow() {
    const s = screen.getPrimaryDisplay();
    
    let w = this.window;

    if (this.window === null) {
      this.window = new BrowserWindow({
        x: 0,
        y: 0,
        width: s.workArea.width * 2 / 3,
        height: s.workArea.height
      });
      // this.window.webContents.openDevTools();

      this.render();
      this._registerCallbacks();
    }
  }

  deleteWindow() {
    if (this.window !== null) {
      this.window.removeAllListeners('close');
      this.window = null;
    }
  }

  //============================= render function ============================//

  render() {
    const routes = config.dist.app.routes;
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
  }

  //------------------------------ ipc send ----------------------------------//

  // on devices channel, cmd can be :
  // - noDriverInstalled
  // - deviceList
  // - activeDevice
  // - serialPorts
  // - wifiConnections
  // - info
  // - osc

  send(channel, cmd, arg) {
    if (this.window !== null) {
      // route OSC messages for display
      if (cmd === 'osc') {
        switch (channel) {
          case 'devices':
            if (arg.medium === 'wifi') {
              arg.message.port = config.dist.movuinoOSCServer.localPort;
              this.window.webContents.send('oscDisplay', 'movOut', arg);
            }
            break;
          case 'localServer':
            if (this.info !== null) {
              const suffix = stripMovuinoOSCPrefix(arg.message.address, this.info.id);

              if (suffix === '/vibroPulse' || suffix === '/vibroNow') {
                arg.message.port = config.dist.localOSCServer.localPort;
                this.window.webContents.send('oscDisplay', 'localIn', arg);
              }
            }
            break;
          default:
            break;
        }
      }

      if (channel === 'devices' && cmd === 'info') {
        this.info = arg.info;
      }

      this.window.webContents.send(channel, cmd, arg);
    }
  }

  _registerCallbacks() {

    //----------------------------- ipc receive ------------------------------//

    ipc.on('controller', (e, cmd, arg) => {
      switch (cmd) {
        case 'loaded':
          this.emit('devices', 'getSerialPorts');
          this.emit('devices', 'getWiFiConnections');
          this.emit('loaded');
          break;
        case 'render': // this allows to trig a proper reloading of the page
          if (this.window !== null) {
            this.render();
          }
          break;
        case 'getMyIP':
          const ip = getMyIP();
          if (ip !== null) {
            this.send('controller', 'getMyIP', ip);
          }
          break;
        case 'recording':
          console.log('received recording : ' + JSON.stringify(arg, null, 2));

          if (arg.formats.indexOf('excel') !== -1) {
            createExcelDocFromRecording(arg.data).then((buffer) => {
              if (arg.formats.length === 1) {
                fs.writeFileSync(arg.filename, buffer);
              }
            });
          }
          break;
        default:
          break;
      }
    });

    ipc.on('devices', (e, cmd, arg) => {
      this.emit('devices', cmd, arg);

      if (cmd === 'osc' && arg.medium === 'wifi' && this.window !== null) {
        arg.message.port = config.dist.movuinoOSCServer.remotePort;
        const args = [];
        arg.message.args.forEach((a) => {
          args.push(typeof a === 'object' ? a.value : a);
        });
        arg.message.args = args;
        this.window.webContents.send('oscDisplay', 'movIn', arg);
      }
    });

    ipc.on('localServer', (e, cmd, arg) => {
      this.emit('localServer', cmd, arg);

      // how to filter where messages must go here ?

      if (cmd === 'osc' && this.window !== null) {
        arg.message.port = config.dist.localOSCServer.remotePort
        this.window.webContents.send('oscDisplay', 'localOut', arg);
      }
    });

    ipc.on('machineLearning', (e, cmd, arg) => {
      this.emit('machineLearning', cmd, arg);
    });

    //---------------------------- window stuff ------------------------------//

    this.window.webContents.on('did-finish-load', () => {
      // eventually do stuff here
      // this.send('renderer', 'browserwindow', this.window);
    });

    this.window.on('close', (e) => {
      // e.preventDefault();
      // this.send('menu', 'closeCurrentTab');
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }
};

export default ViewController;