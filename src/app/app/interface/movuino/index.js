import { ipcRenderer as ipc, remote } from 'electron';
import Script from '../../../shared/core/Script';
import BargraphRenderer from '../../../shared/core/BargraphRenderer';
import WaveformRenderer from '../../../shared/core/WaveformRenderer';

//============================ ELECTRON STUFF ================================//

ipc.on('renderer', function(e, arg) {
  if (arg === 'toggledevtools') {
    remote.getCurrentWindow().toggleDevTools();
  }
});

window.addEventListener('beforeunload', (e) => {
  ipc.send('renderer', 'refresh');
});

//=========================== MOVUINO INTERFACE ==============================//

// the Script class makes sure all the DOM is loaded
class Movuino extends Script {
  constructor() {
    super();
    const lightYellow = '#fff17a';
    const lightBlue = '#7cdde2';
    const lightRed = '#f45a54';
    this.fillStyles = [ lightYellow, lightBlue, lightRed ];
  }

  loaded() {
    this.isLoaded = true;
    // setup callbacks / listeners

    this.$refresh = document.querySelector('#refresh-serialports-menu');
    this.$serialMenu = document.querySelector('#serialports-menu');

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
    });

    this.$serialMenu.addEventListener('change', () => {
      ipc.send('serialport', 'port', this.$serialMenu.selectedIndex);
    });

    // prepare canvas for drawing

    this.$sensorBargraphs = [
      document.querySelector('#movuino-accelerometers'),
      document.querySelector('#movuino-gyroscopes'),
      document.querySelector('#movuino-magnetometers'),
    ];

    this.$sensorWaveforms = [
      document.querySelector('#movuino-accelerometer-waveforms'),
      document.querySelector('#movuino-gyroscope-waveforms'),
      document.querySelector('#movuino-magnetometer-waveforms'),
    ];

    this.$waveformLabels = [
      [
        document.querySelector('#accel-x-waveform-label'),
        document.querySelector('#accel-y-waveform-label'),
        document.querySelector('#accel-z-waveform-label'),
      ],
      // etc
    ];

    this.bargraphRenderers = [];
    this.waveformRenderers = [];

    for (let i = 0; i < 3; i++) {
      const bg = this.$sensorBargraphs[i];
      const wf = this.$sensorWaveforms[i];
      this.bargraphRenderers.push(new BargraphRenderer(bg, this.fillStyles));
      this.waveformRenderers.push(new WaveformRenderer(wf, this.fillStyles));
      this.bargraphRenderers[i].start();
      this.waveformRenderers[i].start();
    }

    this.$zoom = document.querySelector('#zoom-slider');
    this.$zoom.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].zoom = this.$zoom.value * 0.01;
      }
    });

    this.$lineWidth = document.querySelector('#line-width-slider');
    this.$lineWidth.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].lineWidth = this.$lineWidth.value * 0.01 + 1;
      }
    });

    this.$lineStyle = document.querySelector('#line-style-menu');
    this.$lineStyle.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].lineStyle = this.$lineStyle.value;
      }
    });

    this.$pointStyle = document.querySelector('#point-style-menu');
    this.$pointStyle.addEventListener('change', () => {
      for (let i = 0; i < 3; i++) {
        this.waveformRenderers[i].pointStyle = this.$pointStyle.value;
      }
    });
  }

  setData(data) {
    if (this.isLoaded) {
      for (let i = 0; i < 3; i++) {
        this.bargraphRenderers[i].setData(data[i]);
        this.waveformRenderers[i].setData(data[i]);
      }
    }
  }
};

console.log('bonne nuit les petits');

const movuino = new Movuino();

setInterval(() => {
  const t1 = [ Math.random(), Math.random(), Math.random() ];
  const t2 = [ Math.random(), Math.random(), Math.random() ];
  const t3 = [ Math.random(), Math.random(), Math.random() ];

  movuino.setData([t1, t2, t3]);
}, 40);
