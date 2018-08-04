import EventEmitter from 'events';
import { ipcRenderer as ipc } from 'electron';
import BargraphRenderer from '../../shared/renderers/BargraphRenderer';

class Movuino extends EventEmitter {
  constructor() {
    super();

    const lightYellow = '#fff17a';
    const lightBlue = '#7cdde2';
    const lightRed = '#f45a54';
    this.fillStyles = [ lightYellow, lightBlue, lightRed ];

    this.serialPorts = null;
    this.comName = null;
    this.info = null; // could be an array to maintain a multi-movuino state

    this.allowUpdateWiFiConnections = true;
    this.initialized = false;
  }

  init() {

    //---------------------------- serial menu -------------------------------//

    this.$serialMenu = document.querySelector('#serialports-menu');
    this.$movuinoFound = document.querySelector('#movuino-found-label');

    this.$serialMenu.addEventListener('change', () => {
      const value = this.$serialMenu.options[this.$serialMenu.selectedIndex].value;
      this.comName = value === "noPortConnected" ? null : value;
      this.emit('serialPort', this.comName);
    });

    //------------------------------------------------------------------------//

    this.$ssid = document.querySelector('#network-ssid');
    this.$password = document.querySelector('#network-password');
    this.$ip1 = document.querySelector('#host-ip-1');
    this.$ip2 = document.querySelector('#host-ip-2');
    this.$ip3 = document.querySelector('#host-ip-3');
    this.$ip4 = document.querySelector('#host-ip-4');
    this.$hostIP = [ this.$ip1, this.$ip2, this.$ip3, this.$ip4 ];

    //----------------------------- get my IP --------------------------------//

    this.$getMyIP = document.querySelector('#get-my-ip-btn');

    this.$getMyIP.addEventListener('click', (e) => {
      this.emit('controller', 'getMyIP');
    });

    //------------------------------------------------------------------------//
    // TODO : maybe replace this by a dynamic select menu with identifiers obtained from wifi
    this.$movuinoId = document.querySelector('#movuino-osc-identifier');

    //------------------------------------------------------------------------//

    this.$movip1 = document.querySelector('#movuino-ip-1');
    this.$movip2 = document.querySelector('#movuino-ip-2');
    this.$movip3 = document.querySelector('#movuino-ip-3');
    this.$movip4 = document.querySelector('#movuino-ip-4');
    this.$movuinoIP = [ this.$movip1, this.$movip2, this.$movip3, this.$movip4 ];

    this.$refreshWiFi = document.querySelector('#refresh-movuino-wifi-btn');

    this.$refreshWiFi.addEventListener('click', (e) => {
      // a timeout of 1000 is empirically good to prevent info and wifiConnections to interfere
      this.allowUpdateWiFiConnections = false;
      setTimeout(() => { this.allowUpdateWiFiConnections = true; }, 1000);

      // this.updateInfoFromDOM();

      const hostIP = `${this.$ip1.value}.${this.$ip2.value}.${this.$ip3.value}.${this.$ip4.value}`;

      this.emit('devices', 'osc', {
        medium: 'serial',
        message: {
          address: '/wifi/set',
          args: [
            { type: 's', value: this.$ssid.value },
            { type: 's', value: this.$password.value },
            { type: 's', value: hostIP },
          ]
        }
      });
    });

    this.$wiFiCircle = document.querySelector('#movuino-connected-circle');
    this.$wiFiStatus = document.querySelector('#movuino-connected-label');


    //-------------------------- BARGRAPH RENDERERS --------------------------//

    this.$sensorBargraphs = [
      document.querySelector('#movuino-accelerometers'),
      document.querySelector('#movuino-gyroscopes'),
      document.querySelector('#movuino-magnetometers'),
    ];

    this.bargraphRenderers = [];

    for (let i = 0; i < 3; i++) {
      const bg = this.$sensorBargraphs[i];
      this.bargraphRenderers.push(new BargraphRenderer(bg, this.fillStyles));
      this.bargraphRenderers[i].start();
    }

    this.initialized = true;
  }

  updateSerialPorts(serialPorts) {
    this.serialPorts = serialPorts || [];

    while (this.$serialMenu.firstChild) {
      this.$serialMenu.removeChild(this.$serialMenu.firstChild);
    }

    var opt = document.createElement("option");
    opt.value = "noPortConnected";
    opt.innerHTML = 'Available ports';
    this.$serialMenu.appendChild(opt);

    let portStillExists = false;

    for (var i = 0; i < this.serialPorts.length; i++) {
      opt = document.createElement("option");

      if (this.serialPorts[i].comName === this.comName) {
        opt.selected = portStillExists = true;
      }

      opt.value = serialPorts[i].comName;
      const name = serialPorts[i].comName.split('/dev/tty.').join('');
      opt.innerHTML = name;

      this.$serialMenu.appendChild(opt);
    }

    if (!portStillExists) {
      this.comName = null;
      this.emit('serialPort', null);
    }
  }

  updateWiFiConnections(wifiConnections) {
    if (this.allowUpdateWiFiConnections) {
      const state = this.info !== null
                  ? (wifiConnections.indexOf(this.info.id) === -1 ? 0 : 1)
                  : 0;

      // this.info.wifiState = state;
      // console.log('movuino ' + (state === 1 ? 'dis' : '') + 'connected');
      // this.info.wifiState = state;
      this.setWiFiState(state);
    }
  }

  updateInfo(movuinoInfo = null) {
    this.info = movuinoInfo.info || this.info; // (we could also get movuinoInfo.device, which is the device list id)
    console.log(JSON.stringify(this.info, null, 2));

    this.setSerialState(this.info.serialPortReady);

    this.$ssid.value = this.info.ssid;
    this.$password.value = this.info.password;
    this.setHostIP(this.info.hostIP);
    this.$movuinoId.value = this.info.id;

    this.setWiFiState(this.info.wifiState);
    this.setMovuinoIP(this.info.movuinoIP);
  }

  // updateInfoFromDOM() {
  //   this.info.ssid = this.$ssid.value;
  //   this.info.password = this.$password.value;
  //   this.info.hostIP = `${this.$ip1}.${this.$ip2}.${this.$ip3}.${this.$ip4}`;
  // }

  processOSCMessage(message) {
    if (this.info !== null && message.id === this.info.id &&
        message.from === 'movuino' && message.medium === 'serial') {
      const msg = message.message;

      if (msg.address === '/frame') {
        const a = msg.args;
        const acc = [ a[0], a[1], a[2] ];
        const gyr = [ a[3], a[4], a[5] ];
        const mag = [ a[6], a[7], a[8] ];
        for (let i = 0; i < 3; ++i) {
          acc[i] = acc[i] * 0.5 + 0.5;
          gyr[i] = gyr[i] * 0.5 + 0.5;
          mag[i] = mag[i] * 0.5 + 0.5;
        }
        this.setBargraphData([ acc, gyr, mag ]);
      }
    }
  }

  //==========================================================================//

  setSerialState(connected) {
    this.$movuinoFound.className = connected ? 'good' : 'bad';
    this.$movuinoFound.innerHTML = connected ? 'Movuino connected' : 'Movuino not connected';    
  }

  setBargraphData(data) { // set from serial
    if (this.initialized) {
      for (let i = 0; i < 3; i++) {
        this.bargraphRenderers[i].setData(data[i]);
      }
    }
  }

  setWiFiState(state) {
    if (this.$wiFiStatus.classList.contains('good')) {
      this.$wiFiCircle.classList.remove('good');
      this.$wiFiStatus.classList.remove('good');
    }

    if (this.$wiFiStatus.classList.contains('neutral')) {
      this.$wiFiCircle.classList.remove('neutral');
      this.$wiFiStatus.classList.remove('neutral');
    }

    if (this.$wiFiStatus.classList.contains('bad')) {
      this.$wiFiCircle.classList.remove('bad');
      this.$wiFiStatus.classList.remove('bad');
    }

    switch (state) {
      case 0:
        this.$wiFiCircle.classList.add('bad');
        this.$wiFiStatus.innerHTML = 'Movuino disconnected';
        this.$wiFiStatus.classList.add('bad');
        break;
      case 2:
        this.$wiFiCircle.classList.add('neutral');
        this.$wiFiStatus.innerHTML = 'Connecting movuino ...';
        this.$wiFiStatus.classList.add('neutral');
        break;
      case 1:
        this.$wiFiCircle.classList.add('good');
        this.$wiFiStatus.innerHTML = 'Movuino connected';
        this.$wiFiStatus.classList.add('good');
        break;
      default:
        break;
    }

    this.emit('connected', state === 1);
  }

  setHostIP(ip) {
    this._setIP(this.$hostIP, ip);
  }

  setMovuinoIP(ip) {
    this._setIP(this.$movuinoIP, ip);
  }

  _setIP($ip, ip) {
    const ipArr = ip.split('.');
    if (ipArr.length === 4) {
      $ip[0].value = parseInt(ipArr[0]);      
      $ip[1].value = parseInt(ipArr[1]);      
      $ip[2].value = parseInt(ipArr[2]);      
      $ip[3].value = parseInt(ipArr[3]);      
    }
  }
};

export default Movuino;