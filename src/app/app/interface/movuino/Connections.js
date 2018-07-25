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

    //----------------------- get items to show / hide -----------------------//

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

    //------------------------ get display text areas ------------------------//

    this.messageDivs = {
      movIn: document.querySelector('#movuino-osc-flow-input-messages'),
      movOut: document.querySelector('#movuino-osc-flow-output-messages'),
      localIn: document.querySelector('#local-osc-flow-input-messages-1'),
      localOut1: document.querySelector('#local-osc-flow-output-messages-1'),
      localOut2: document.querySelector('#local-osc-flow-output-messages-2'),
      localOut3: document.querySelector('#local-osc-flow-output-messages-3'),
    };
  }

  showOSCConnections(show) {
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

  displayMessage(dst, message) {
    // if (!this.visible) return;
    const now = Date.now();
    const msg = message.message;

    if (dst === 'localOut') {
      const suffix = msg.address.split('/').pop();
      if (suffix === 'sensors') {
        dst = 'localOut1';
      } else if (suffix === 'repetitions') {
        dst = 'localOut2';
      } else if (suffix === 'gestures') {
        dst = 'localOut3';
      }
    }

    if (this.messageRoutes.indexOf(dst) !== -1) {
      if (now - this.messageTimers[dst] > this.OSCMessageDisplayInterval) {
        this.messageTimers[dst] = now;
        this.messageDivs[dst].innerHTML = this._messageToString(msg);
      }
    }

  }

  _messageToString(msg) {
    let oscStr = `Port ${msg.port}<br>`;
    oscStr += `${msg.address}<br>`;

    const suffix = msg.address.split('/').pop();

    if (suffix === 'frame' || suffix === 'sensors') {
      for (let i = 0; i < 3; i++) {
        oscStr += `${msg.args[i * 3].toFixed(2)}`;
        oscStr += ` ${msg.args[i * 3 + 1].toFixed(2)}`;
        oscStr += ` ${msg.args[i * 3 + 2].toFixed(2)}<br>`;
      }

      if (suffix === 'frame') {
        oscStr += `${msg.args[9]} ${msg.args[10]}`;
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
};

export default Connections;