import EventEmitter from 'events';
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
    this.udpPort = new osc.UDPPort({
      localAddress: config.dist.movuinoOSCServer.localAddress,
      localPort: config.dist.movuinoOSCServer.localPort
    });      
    this.udpPortReady = false;
    this.interval = null;
    this.lastUDPMessageDates = new Map();
    this.wifiConnectionTimeout = 500;
  }

  emitWiFiConnections() {
    const res = {};
    this.lastUDPMessageDates.forEach((value, key, map) => {
      res[key] = value.info.address;
    });
    this.emit('wifiConnections', res);
  }

  startObservingOSCMessages() {
    return new Promise((resolve, reject) => {
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

        this.lastUDPMessageDates.set(parts.id, {
          date: Date.now(),
          info: info,
        });

        if (idIsNew) {
          this.emitWiFiConnections();
        }

        this.udpPort.emit(`movuino-${parts.id}`, { address: address, args: args }, timeTag, info);
      });

      this.udpPort.open();

      this.interval = setInterval(() => {
        const now = Date.now();
        let connectionsChanged = false;

        this.lastUDPMessageDates.forEach((value, key, map) => {
          if (now - value.date > this.wifiConnectionTimeout) {
            this.lastUDPMessageDates.delete(key);
            connectionsChanged = true;
          }
        });

        if (connectionsChanged) {
          this.emitWiFiConnections();
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