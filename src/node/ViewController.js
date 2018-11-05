import EventEmitter from 'events';

import {
  screen,
  BrowserWindow,
  ipcMain as ipc
} from 'electron';

//============================================================================//

class ViewController extends EventEmitter {
  constructor() {
    super();
    this.info = null;
    this.window = null;
    this.send = this.send.bind(this);
    this.addListener = this.addListener.bind(this);
    this.render = this.render.bind(this);
  }

  createWindow() {
    const s = screen.getPrimaryDisplay();

    if (this.window === null) {
      this.window = new BrowserWindow({
        x: 0,
        y: 0,
        width: s.workArea.width * 2 / 3,
        height: s.workArea.height
      });
      // this.window.webContents.openDevTools();

      this.render();    
    }
  }

  deleteWindow() {
    if (this.window !== null) {
      this.window.removeAllListeners('close');
      this.window = null;
    }
  }

  addListener(channel, callback) {
    ipc.on(channel, (e, data) => { callback(data); });
  }

  send(channel, data) {
    if (this.window !== null) {
      this.window.webContents.send(channel, data);
    }
  }

  //============================= render function ============================//

  render() {
    if (this.window !== null) {
      this.window.loadURL(`file://${__dirname}/../browser/index.html`);
    }
  }
};

const instance = new ViewController();

export default instance;