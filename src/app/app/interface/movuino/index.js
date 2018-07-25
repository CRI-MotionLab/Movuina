import { ipcRenderer as ipc, remote } from 'electron';
import Script from '../../../shared/core/Script';
import Movuino from './Movuino';
import Connections from './Connections';
import Computer from './Computer';
import Tabs from './Tabs';
import ejs from 'ejs';

//============================ ELECTRON STUFF ================================//

//=========================== MOVUINO INTERFACE ==============================//

// the Script class makes sure all the DOM is loaded

class Main extends Script {
  constructor() {
    super();
    this.movuino = new Movuino();
    this.connections = new Connections();
    this.computer = new Computer();
    // this.tabs = new Tabs();

    this.setLightBox = this.setLightBox.bind(this);
  }

  loaded() {
    ipc.send('controller', 'loaded');

    this.movuino.init();
    this.connections.init();
    this.computer.init();
    // this.tabs.init();

    //============ listen to channels forwarded by ViewController ============//

    ////////// menu stuff

    ipc.on('menu', (e, ...args) => {
      const cmd = args[0];
      const arg = args[1];

      switch (cmd) {
        case 'device':
          if (arg === 'add') {
            console.log('about to add a device tab');
          } else if (arg === 'next') {
            console.log('about to switch device tab');
          }
          break;
        case 'showOSCConnections':
          this.connections.showOSCConnections(arg);
          this.computer.setUpdateWaveformDimensionsDuring(500);
          break;
        default:
          break;
      }
    });

    ////////// for OSC connections display

    ipc.on('oscDisplay', (e, ...args) => {
      this.connections.displayMessage(args[0], args[1]); // dst, message
    })

    ////////// messages from movuino(s)

    ipc.on('devices', (e, ...args) => {
      const cmd = args[0];
      const arg = args.length > 1 ? args[1] : null;

      switch (cmd) {
        case 'noDriverInstalled':
          this.showDriverDownloadLightBox(arg);
          break;
        case 'serialPorts':
          this.movuino.updateSerialPorts(arg);
          break;
        case 'wifiConnections':
          this.movuino.updateWiFiConnections(arg);
          break;
        case 'info':
          this.movuino.updateInfo(arg);
          this.computer.updateInfo(arg);
          break;
        case 'osc':
          this.computer.processOSCMessage(arg);
          this.movuino.processOSCMessage(arg);
          break;
        default:
          break;
      }
    });

    ////////// messages from local OSC server

    ipc.on('localServer', (e, ...args) => {
      const cmd = args[0];
      const arg = args.length > 1 ? args[1] : null;

      switch (cmd) {
        case 'osc':
          this.computer.processOSCMessage(arg);
          break;
        default:
          break;
      }
    });

    ipc.on('machineLearning', (e, ...args) => {
      if (args[0] === 'model') {
        this.computer.setGestureModel(args[1]);
      }
    });

    ////////// messages from controller itself

    ipc.on('controller', (e, ...args) => {
      const cmd = args[0];
      const arg = args.length > 1 ? args[1] : null;

      switch (cmd) {
        case 'getMyIP':
          this.movuino.setHostIP(arg);
          break;
        case 'closeCurrentTab':
          console.log('about to close current tab');
          break;
        default:
          break;
      }
    });

    //========= forward messages from client components to controller ========//

    ////////// movuino callback listeners

    this.movuino.on('serialPort', (port) => {
      ipc.send('devices', 'serialPort', port);
    });

    this.movuino.on('controller', (cmd, arg) => {
      ipc.send('controller', cmd, arg);
    });

    this.movuino.on('devices', (cmd, arg) => {
      ipc.send('devices', cmd, arg);
    });

    this.movuino.on('connected', (arg) => {
      this.computer.setMovuinoConnected(arg);
    })

    ////////// computer callback listeners

    this.computer.on('controller', (cmd, arg) => {
      ipc.send('controller', cmd, arg);
    });

    this.computer.on('localServer', (cmd, arg) => {
      ipc.send('localServer', cmd, arg);
    });

    this.computer.on('devices', (cmd, arg) => {
      ipc.send('devices', cmd, arg);
    });

    this.computer.on('machineLearning', (cmd, arg) => {
      ipc.send('machineLearning', cmd, arg);
    });

    //========================== LIGHTBOX STUFF ==============================//

    this.$lightBox = document.querySelector('#lightbox');
    // this.$tabs = document.querySelector('#movuino-tabs');

    this.computer.on('recording', (recording) => {
      if (recording.length === 0) return;

      const lightBoxContents = ejs.render(`
        <div id="lightbox-contents">
          <p>
            Save recording as ...
            <div>
            <ul>
            <li> <input type="checkbox" id="select-all-formats"> All formats </li>
            <li> <br> </li>
            <li> <input type="checkbox" id="csv"> CSV (.csv) </li>
            <li> <input type="checkbox" id="excel"> Excel (.xlsx) </li>
            </ul>
            </div>
          </p>
          <button id="ok-btn"> OK </button>
        </div>
      `);

      this.$lightBox.innerHTML = lightBoxContents;

      const $all = document.querySelector('#select-all-formats');
      $all.addEventListener('change', () => {
        const $ul = document.querySelector('#lightbox-contents ul');
        const checkboxes = $ul.getElementsByTagName('input');

        for (let c = 0; c < checkboxes.length; c++) {
          checkboxes[c].checked = $all.checked;
        }
      });

      const $okBtn = document.querySelector('#ok-btn');

      $okBtn.addEventListener('click', () => {
        const $ul = document.querySelector('#lightbox-contents ul');
        const checkboxes = $ul.getElementsByTagName('input');
        const formats = [];

        for (let c = 0; c < checkboxes.length; c++) {
          if (checkboxes[c].checked) {
            formats.push(checkboxes[c].id);
          }
        }

        if (formats.length > 0) { // otherwise we don't save anything
          let ext;

          if (formats.length > 1) {
            ext = 'zip'
          } else {
            if (formats[0] === 'excel') {
              ext = 'xlsx';
            } else if (formats[0] === 'csv') {
              ext = 'csv';
            } else {
              ext = 'txt';
            }
          }

          remote.dialog.showSaveDialog({
            defaultPath: `Movuino-recording-${Date.now()}.${ext}`,
          }, (filename) => {
            if (filename !== undefined) {
              ipc.send('renderer', 'recording', {
                data: recording,
                formats: formats,
                filename: filename
              });
            }
          });
        }

        this.setLightBox(false);

      });

      this.setLightBox(true);
    });


    //--------------------------------------------
    // ELECTRON STUFF

    window.addEventListener('beforeunload', (e) => {
      ipc.send('controller', 'render');
    });

    // this.movuino.on('sensors', (sensors) => {
    //   this.computer.setWaveformData(sensors);
    // });
  }

  showDriverDownloadLightBox(downloadUrl) {
    // CREATE LIGHTBOX CONTENTS AND DISPLAY IT :
    const lightBoxContents = ejs.render(`
      <div id="lightbox-contents">
        <p>
          It seems that you don't have the proper serial drivers installed.<br>
          Would you like to <a id="download-drivers-link" href="#"> download them </a> ?
        </p>
        <button id="ok-btn"> CLOSE </button>
      </div>
    `);
    this.$lightBox.innerHTML = lightBoxContents;

    const $link = document.querySelector('#download-drivers-link');
    $link.addEventListener('click', () => {
      require('electron').shell.openExternal(downloadUrl);
    });

    const $okBtn = document.querySelector('#ok-btn');
    $okBtn.addEventListener('click', () => {
      this.setLightBox(false);
    });

    this.setLightBox(true);
  }

  setLightBox(active, contents = null) {
    // const $lightBox = document.querySelector('#lightbox');
    if (active) {
      if (!this.$lightBox.classList.contains('on')) {
        // this.$lightBox.innerHTML = this.$lightBoxContents;
        this.$lightBox.classList.add('on');
      }
    } else {
      if (this.$lightBox.classList.contains('on')) {
        this.$lightBox.classList.remove('on');
      }
    }
  }
};

console.log('bonne nuit les petits');

const main = new Main();
