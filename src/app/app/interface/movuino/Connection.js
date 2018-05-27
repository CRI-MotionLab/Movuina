import { ipcRenderer as ipc } from 'electron';

class Connection {
  constructor() {
    this.lastOSCMessageDisplayDate = Date.now();
    this.OSCMessageDisplayInterval = 40;
  }

  init() {
    this.$oscInDiv = document.querySelector('#osc-flow-input-messages');
    this.$oscOutDiv = document.querySelector('#osc-flow-output-messages');

    ipc.on('oscmessage', (e, ...args) => {
      // console.log(args);
      const now = Date.now();

      if (args[0] === 'input' && now - this.lastOSCMessageDisplayDate > this.OSCMessageDisplayInterval) {
        this.lastOSCMessageDisplayDate = now;

        let oscInStr = `Port ${args[1].port}<br>`;
        oscInStr += `${args[1].address}<br>`;

        for (let i = 0; i < 3; i++) {
          oscInStr += `${args[1].args[i * 3].value.toFixed(2)}`;
          oscInStr += `${args[1].args[i * 3 + 1].value.toFixed(2)}`;
          oscInStr += `${args[1].args[i * 3 + 2].value.toFixed(2)}<br>`;
        }

        this.$oscInDiv.innerHTML = oscInStr;
      }
    });
  }
};

export default Connection;