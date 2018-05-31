import { ipcRenderer as ipc } from 'electron';

class Connections {
  constructor() {
    this.visible = false;

    const now = Date.now();
    this.OSCMessageDisplayInterval = 40;

    this.messageTimers = {};
    this.messageRoutes = [
      'movIn', 'movOut', 'localIn', 'localOut1', 'localOut2', 'localOut3'
    ];

    this.messageRoutes.forEach((route) => {
      this.messageTimers[route] = now;
    });
  }

  init() {
    this.$items = [
      document.querySelector('#main'),
      document.querySelector('#movuino-osc-connections'),
    ];

    const arrows = document.getElementsByClassName('osc-arrow');
    const messages = document.getElementsByClassName('osc-messages');

    for (let i = 0; i < arrows.length; i++) {
      this.$items.push(arrows.item(i));
    }

    for (let i = 0; i < messages.length; i++) {
      this.$items.push(messages.item(i));
    }

    this.messageDivs = {
      movIn: document.querySelector('#movuino-osc-flow-input-messages'),
      movOut: document.querySelector('#movuino-osc-flow-output-messages'),
      localIn: document.querySelector('#local-osc-flow-input-messages-1'),
      localOut1: document.querySelector('#local-osc-flow-output-messages-1'),
      localOut2: document.querySelector('#local-osc-flow-output-messages-2'),
      localOut3: document.querySelector('#local-osc-flow-output-messages-3'),
    };

    ipc.on('oscserver', (e, ...args) => {
      if (!this.visible) return;

      if (args[0] === 'display') {
        const dst = args[1].target;
        const now = Date.now();

        if (this.messageRoutes.indexOf(dst) !== -1) {
          if (now - this.messageTimers[dst] > this.OSCMessageDisplayInterval) {
            this.messageTimers[dst] = now;
            // console.log(this._messageToString(args.msg));
            this.messageDivs[dst].innerHTML = this._messageToString(args[1].msg);
          }
        }
      }
    });

    ipc.on('menu', (e, ...args) => {
      if (args[0] === 'showOSCConnections') {
        this._showOSCConnections(args[1]);
      }
    });
  }

  _messageToString(msg) {
    let oscStr = `Port ${msg.port}<br>`;
    oscStr += `${msg.address}<br>`;

    const suffix = msg.address.split('/').pop();

    if (suffix === 'sensors' || suffix === 'filteredSensors') {
      for (let i = 0; i < 3; i++) {
        oscStr += `${msg.args[i * 3].toFixed(2)}`;
        oscStr += ` ${msg.args[i * 3 + 1].toFixed(2)}`;
        oscStr += ` ${msg.args[i * 3 + 2].toFixed(2)}<br>`;
      }
    } else {
      for (let i = 0; i < msg.args.length; i++) {
        if (i > 0) oscStr += ' ';
        if (typeof msg.args[i] === 'number' &&
            !Number.isInteger(msg.args[i])) {
          oscStr += `${msg.args[i].toFixed(2)}`;
        } else {
          oscStr += `${msg.args[i]}`;
        }
      }
    }

    return oscStr;
  }

  _showOSCConnections(show) {
    this.visible = show;
    const className = 'show-osc-connections';

    for (let i = 0; i < this.$items.length; i++) {
      if (this.$items[i].classList.contains(className) && !show) {
        this.$items[i].classList.remove(className);
      } else if (!this.$items[i].classList.contains(className) && show) {
        this.$items[i].classList.add(className);
      }
    }
  }
};

export default Connections;