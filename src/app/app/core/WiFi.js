import EventEmitter from 'events';
// import nmap from 'libnmap';
// import isPortReachable from 'is-port-reachable';
import osc from 'osc';

// this is just a copy of build/config/<used_config_name>.js
// <used_config_name> is "default" by default
// it can be provided as an extra argument to "npm run [watch/build]"
import config from '../../../config';
import { getMovuinoIdAndOSCSuffixFromAddress } from './util';

//----------------------------------------------------------------------------//

class WiFi extends EventEmitter {
  constructor() {
    super();
    // try {
      this.udpPort = new osc.UDPPort({
        localAddress: config.dist.movuinoOSCServer.localAddress,
        localPort: config.dist.movuinoOSCServer.localPort
      });      
    // } catch (err) {
    //   this.udpPort = null;
    //   console.log(err.message);
    // }
    this.udpPortReady = false;
    this.interval = null;
    this.lastUDPMessageDates = new Map();
    this.wifiConnectionTimeout = 500;
  }

  startObservingOSCMessages() {
    return new Promise((resolve, reject) => {
      // nmap.scan({
      //   ports: `${config.dist.movuinoOSCServer.localPort}`,
      //   range: [ 'localhost' ],
      // }, (err, report) => {
      //   console.log(err);
      //   console.log(JSON.stringify(report, null, 2));
      // });

      // isPortReachable(config.dist.movuinoOSCServer.localPort, { host: '0.0.0.0' })
      // .then((r) => { console.log('port reachable: ' + r); });

      this.udpPort.on('error', (err) => { console.log(err.message); });

      this.udpPort.on('ready', () => {
        this.udpPortReady = true;
        resolve();
      });

      this.udpPort.on('message', ({ address, args }, timeTag, info) => {
        const parts = getMovuinoIdAndOSCSuffixFromAddress(address);

        let idIsNew = false;
        if (!this.lastUDPMessageDates.has(parts.id)) {
          idIsNew = true;
        }

        this.lastUDPMessageDates.set(parts.id, Date.now());

        if (idIsNew) {
          this.emit('wifiConnections', Array.from(this.lastUDPMessageDates.keys()));
        }

        this.udpPort.emit(`movuino-${parts.id}`, { address: address, args: args }, timeTag, info);
      });

      // try {
        this.udpPort.open();
      // } catch (err) {
      //   console.log(err.message);
      // }

      this.interval = setInterval(() => {
        const now = Date.now();
        let connectionsChanged = false;

        this.lastUDPMessageDates.forEach((value, key, map) => {
          if (now - value > this.wifiConnectionTimeout) {
            this.lastUDPMessageDates.delete(key);
            connectionsChanged = true;
          }
        });

        if (connectionsChanged) {
          this.emit(
            'wifiConnections',
            Array.from(this.lastUDPMessageDates.keys())
          );
        }
      }, this.wifiConnectionTimeout * 0.5);
    });
  }

  stopObservingOSCMessages() {
    return new Promise((resolve, reject) => {
      const deinit = () => {
        if (this.interval !== null) {
          clearInterval(this.interval);
        }

        this.interval = null;
        resolve();
      }

      const closeListener = () => {
        console.log('normal close');
        deinit();
      }

      const errorListener = (err) => {
        if (err.message === 'Port is not open') {
          console.log('port not open');
          this.udpPort.removeListener('close', closeListener);
          this.udpPort.removeListener('error', errorListener);
          deinit();            
        }
      }

      this.udpPort.removeAllListeners();
      this.udpPort.once('close', closeListener);
      this.udpPort.on('error', errorListener); 
      this.udpPort.close();
    });
  }

  getUDPPort() {
    return this.udpPort;
  }
};

const instance = new WiFi();

export default instance;