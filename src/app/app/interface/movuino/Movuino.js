import { ipcRenderer as ipc } from 'electron';
import BargraphRenderer from '../../../shared/core/BargraphRenderer';
import EventEmitter from 'events';

const defaultMovuinoIP = '192.168.0.128';

const defaultMovuinoSettings = {
  oscId: 'movuino',
  ssid: 'my_network_ssid',
  password: 'my_network_password',
  hostIP: '192.168.0.100',
  portIn: 9000,
  portOut: 9001,
  sendOSCSensors: true,
  sendSerialSensors: true,
};

class Movuino extends EventEmitter {
  constructor() {
    super();
    const lightYellow = '#fff17a';
    const lightBlue = '#7cdde2';
    const lightRed = '#f45a54';
    this.fillStyles = [ lightYellow, lightBlue, lightRed ];

    this.movuinoIP = defaultMovuinoIP;
    this.movuinoSettings = defaultMovuinoSettings;
    this.heartBeatTimeout = null;
    this.initialized = false;
  }

  init() {
    this.$refresh = document.querySelector('#refresh-serialports-menu');
    this.$serialMenu = document.querySelector('#serialports-menu');
    this.$movuinoFound = document.querySelector('#movuino-found-label');

    ipc.on('serialport', (e, ...args) => {
      if (args[0] === 'ports') {
        const res = args[1];

        while (this.$serialMenu.firstChild) {
          this.$serialMenu.removeChild(this.$serialMenu.firstChild);
        }

        var opt = document.createElement("option");
        opt.value = -1;
        opt.innerHTML = 'Available ports';
        this.$serialMenu.appendChild(opt);

        for (var i = 0; i < res.length; i++) {
          opt = document.createElement("option");
          opt.value = i;
          opt.innerHTML = res[i].comName.split('/dev/tty.').join('');
          this.$serialMenu.appendChild(opt);
        }
      }
    });

    ipc.send('serialport', 'refresh');

    this.$refresh.addEventListener('click', () => {
      ipc.send('serialport', 'refresh');
      this.onMovuinoConnected(false);
    });

    this.$serialMenu.addEventListener('change', () => {
      ipc.send('serialport', 'port', this.$serialMenu.selectedIndex);
      this.onMovuinoConnected(false);
    });

    ipc.on('movuino', (e, ...args) => {
      if (args[0] === 'movuino') {
        this.onMovuinoConnected(true);
        ipc.send('oscserver', 'restartMovuinoServer', {});
      }
    });

    this.$oscId = document.querySelector('#movuino-osc-identifier');
    this.$ssid = document.querySelector('#network-ssid');
    this.$password = document.querySelector('#network-password');
    this.$ip1 = document.querySelector('#host-ip-1');
    this.$ip2 = document.querySelector('#host-ip-2');
    this.$ip3 = document.querySelector('#host-ip-3');
    this.$ip4 = document.querySelector('#host-ip-4');

    this.$getMyIP = document.querySelector('#get-my-ip-btn');

    this.$portIn = document.querySelector('#movuino-input-port');
    this.$portOut = document.querySelector('#movuino-output-port');

    this.$sendOSCSensors = document.querySelector('#send-osc-sensors');
    this.$sendSerialSensors = document.querySelector('#send-serial-sensors');

    this.$movuinoSettings = [
      this.$oscId, this.$ssid, this.$password,
      this.$ip1, this.$ip2, this.$ip3, this.$ip4,
      this.$portIn, this.$portOut,
    ];

    this.$movip1 = document.querySelector('#movuino-ip-1');
    this.$movip2 = document.querySelector('#movuino-ip-2');
    this.$movip3 = document.querySelector('#movuino-ip-3');
    this.$movip4 = document.querySelector('#movuino-ip-4');

    this.$updateSettings = document.querySelector('#update-movuino-settings-btn');
    this.$wiFiCircle = document.querySelector('#movuino-connected-circle');
    this.$wiFiStatus = document.querySelector('#movuino-connected-label');
    // this.$wiFiOnOff = document.querySelector('#movuino-wifi-on-off-btn');

    // this.$getMovuinoIP = document.querySelector('#get-movuino-ip');

    this.onMovuinoConnected(false);

    ipc.on('renderer', (e, ...args) => {
      if (args[0] === 'getmyip') {
        const hostIP = args[1].split('.');
        this.$ip1.value = parseInt(hostIP[0]);
        this.$ip2.value = parseInt(hostIP[1]);
        this.$ip3.value = parseInt(hostIP[2]);
        this.$ip4.value = parseInt(hostIP[3]);
      }
    });

    this.$getMyIP.addEventListener('click', (e) => {
      ipc.send('renderer', 'getmyip');
    });

    ipc.on('movuino', (e, ...args) => {
      if (args[0] === 'settings') {
        const a = args[1];
        this.$oscId.value = a[0];
        this.$ssid.value = a[1];
        this.$password.value = a[2];

        const hostIP = a[3].split('.');
        this.$ip1.value = parseInt(hostIP[0]);
        this.$ip2.value = parseInt(hostIP[1]);
        this.$ip3.value = parseInt(hostIP[2]);
        this.$ip4.value = parseInt(hostIP[3]);

        this.$portIn.value = parseInt(a[4]);
        this.$portOut.value = parseInt(a[5]);

        // this.$sendOSCSensors.checked = parseInt(a[6]) === 1;
        // this.$sendSerialSensors.checked = parseInt(a[7]) === 1;

        this.updateMovuinoSettings();
      } else if (args[0] === 'ip') {
        const arg = args[1][0];

        const movuinoIP = arg.split('.');
        this.$movip1.value = parseInt(movuinoIP[0]);
        this.$movip2.value = parseInt(movuinoIP[1]);
        this.$movip3.value = parseInt(movuinoIP[2]);
        this.$movip4.value = parseInt(movuinoIP[3]);

        this.movuinoIP = arg;
        this.updateMovuinoSettings(true);
      } else if (args[0] === 'heartbeat') {
        // if ((args[1][0] === '1' && !this.$wiFiOnOff.checked) ||
        //     (args[1][0] === '0' && this.$wiFiOnOff.checked)) {
        //   this.$wiFiOnOff.checked = !this.$wiFiOnOff.checked;
        this.setWiFiState(args[1][0] === '1' ? 'connected' : 'disconnected');

        if (this.movuinoIP !== args[1][1]) {

          const movuinoIP = args[1][1].split('.');
          this.$movip1.value = parseInt(movuinoIP[0]);
          this.$movip2.value = parseInt(movuinoIP[1]);
          this.$movip3.value = parseInt(movuinoIP[2]);
          this.$movip4.value = parseInt(movuinoIP[3]);

          this.movuinoIP = args[1][1];
          this.updateMovuinoSettings(true);
        }

        // CALL THIS ON EACH HEART BEAT :

        if (this.heartBeatTimeout !== null) {
          clearTimeout(this.heartBeatTimeout);
        }

        // this.heartBeatTimeout = setTimeout((() => {
        //   ipc.send('serialport', 'refresh');
        //   this.onMovuinoConnected(false);
        // }).bind(this), 1200);
      } else if (args[0] === 'wifi') {
        this.setWiFiState(args[1][0]);
      }
    });

    this.$updateSettings.addEventListener('click', (e) => {
      this.updateMovuinoSettings();

      ipc.send('movuino', 'settings!', [
        this.movuinoSettings.oscId,
        this.movuinoSettings.ssid,
        this.movuinoSettings.password,
        this.movuinoSettings.hostIP,
        `${this.movuinoSettings.portIn}`,
        `${this.movuinoSettings.portOut}`,
        this.movuinoSettings.sendOSCSensors ? '1' : '0',
        this.movuinoSettings.sendSerialSensors ? '1' : '0',
      ]);
    });

    // this.$wiFiOnOff.addEventListener('change', (e) => {
    //   ipc.send('movuino', 'wifi!', this.$wiFiOnOff.checked ? '1' : '0');
    // });

    // prepare canvas for drawing

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

    ipc.on('movuino', (e, ...args) => {
      if (args[0] === 'sensors') {
        const a = args[1];
        const acc = [ parseFloat(a[0]), parseFloat(a[1]), parseFloat(a[2]) ];
        const gyr = [ parseFloat(a[3]), parseFloat(a[4]), parseFloat(a[5]) ];
        const mag = [ parseFloat(a[6]), parseFloat(a[7]), parseFloat(a[8]) ];
        for (let i = 0; i < 3; ++i) {
          acc[i] = acc[i] * 0.5 + 0.5;
          gyr[i] = gyr[i] * 0.5 + 0.5;
          mag[i] = mag[i] * 0.5 + 0.5;
        }
        this.setBargraphData([ acc, gyr, mag ]);
      }
    });

    // this.$getMovuinoIP.addEventListener('click', () => {
    //   ipc.send('movuino', 'address?');
    // });

    this.initialized = true;
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
      case 'disconnected':
        this.$wiFiCircle.classList.add('bad');
        this.$wiFiStatus.innerHTML = 'Movuino disconnected';
        this.$wiFiStatus.classList.add('bad');
        break;
      case 'connecting':
        this.$wiFiCircle.classList.add('neutral');
        this.$wiFiStatus.innerHTML = 'Connecting movuino ...';
        this.$wiFiStatus.classList.add('neutral');
        break;
      case 'connected':
        this.$wiFiCircle.classList.add('good');
        this.$wiFiStatus.innerHTML = 'Movuino connected';
        this.$wiFiStatus.classList.add('good');
        break;
      default:
        break;
    }
  }

  onMovuinoConnected(connected) {
    this.$movuinoFound.className = connected ? 'good' : 'bad';
    this.$movuinoFound.innerHTML = connected ? 'Movuino connected' : 'Movuino not connected';

    for (let i = 0; i < this.$movuinoSettings.length; i++) {
      this.$movuinoSettings[i].value = '';
      this.$movuinoSettings[i].disabled = !connected;
    }

    this.$getMyIP.disabled = !connected;
    this.$updateSettings.disabled = !connected;

    // [ this.$sendOSCSensors, this.$sendSerialSensors, this.$wiFiOnOff ].forEach((item) => {
    //   item.checked = false;
    //   item.disabled = !connected;
    // });

    if (!connected) {
      ipc.send('oscserver', 'stopMovuinoServer');
    }

    this.emit('connected', connected);
  }

  updateMovuinoSettings(forceUpdate = false) {
    const oscId = this.$oscId.value;
    const ssid = this.$ssid.value;
    const password = this.$password.value;
    const hostIP = `${this.$ip1.value}.${this.$ip2.value}.${this.$ip3.value}.${this.$ip4.value}`;
    const portIn = parseInt(this.$portIn.value);
    const portOut = parseInt(this.$portOut.value);
    // const sendOSCSensors = this.$sendOSCSensors.checked;
    // const sendSerialSensors = this.$sendSerialSensors.checked;
    // console.log(ssid + ' ' + password + ' ' + ip);

    if (forceUpdate ||
        this.movuinoSettings.hostIP !== hostIP ||
        this.movuinoSettings.portIn !== portIn ||
        this.movuinoSettings.portOut !== portOut) {
      ipc.send('oscserver', 'restartMovuinoServer', {
        localAddress: hostIP,
        localPort: portOut,
        remoteAddress: this.movuinoIP,
        remotePort: portIn
      });
    }

    if (this.movuinoSettings.oscId !== oscId) {
      ipc.send('oscserver', 'oscid', oscId);
    }

    this.movuinoSettings = {
      oscId: oscId,
      ssid: ssid,
      password: password,
      hostIP: hostIP,
      portIn: portIn,
      portOut: portOut,
      sendOSCSensors: true, // sendOSCSensors,
      sendSerialSensors: true, // sendSerialSensors,
    };
  }

  setBargraphData(data) {
    if (this.initialized) {
      for (let i = 0; i < 3; i++) {
        this.bargraphRenderers[i].setData(data[i]);
      }
    }
  }
};

export default Movuino;