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
    this.tabs = new Tabs();

    this.setLightBox = this.setLightBox.bind(this);
  }

  loaded() {
    this.movuino.init();
    this.connections.init();
    this.computer.init();
    // this.tabs.init();

    this.$lightBox = document.querySelector('#lightbox');
    this.$tabs = document.querySelector('#movuino-tabs');

    this.movuino.on('connected', (connected) => {
      this.computer.setMovuinoConnected(connected);
    });


    ipc.on('menu', (e, ...args) => {
      if (args[0] === 'device') {
        if (args[1] === 'add') {
          console.log('about to add a device tab');
        } else if (args[1] === 'next') {
          console.log('about to switch device tab');
        }
      }
    });

    ipc.on('renderer', (e, ...args) => {
      if (args[0] === 'closecurrenttab') {
        console.log('about to close current tab');
      } else if (args[0] === 'recording') {
        const lightBoxContents = ejs.render(`
          <div id="lightbox-contents">
            <p>
              Save your recording as
              <div>
              <ul>
              <li> <input type="checkbox"> CSV (.txt) </li>
              <li> <input type="checkbox"> Excel (.xlsx) </li>
              </ul>
              </div>
            </p>
            <button id="ok-btn"> OK </button>
            <button id="no-thanks-btn"> NO, THANKS </button>
          </div>
        `);
        this.$lightBox.innerHTML = lightBoxContents;

        const $okBtn = document.querySelector('#ok-btn');
        $okBtn.addEventListener('click', () => {
          this.setLightBox(false);
        });

        this.setLightBox(true);
      }
    })

    ipc.on('serial', (e, ...args) => {
      console.log(args);
      if (args[0] === 'nodriverinstalled') {
        const downloadUrl = args[1];

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
    });

    //--------------------------------------------
    // ELECTRON STUFF

    window.addEventListener('beforeunload', (e) => {
      ipc.send('renderer', 'refresh');
    });

    // this.movuino.on('sensors', (sensors) => {
    //   this.computer.setWaveformData(sensors);
    // });
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
