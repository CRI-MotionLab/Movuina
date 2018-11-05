import EventEmitter from 'events';
import osc from 'osc';

import config from '../../config';
import { getMovuinoIdAndOSCSuffixFromAddress } from '../util';

//----------------------------------------------------------------------------//

class Wifi extends EventEmitter {
  constructor() {
    super();
    this.udpPort = new osc.UDPPort({
      localAddress: config.movuinoOscServer.localAddress,
      localPort: config.movuinoOscServer.localPort
    });      
    this.udpPortReady = false;
    this.interval = null;
    this.wifiDevices = new Map();
    this.wifiConnectionTimeout = 500;
  }

  //==========================================================================//

  startObservingOSCMessages() {
    return new Promise((resolve, reject) => {
      this.udpPort.on('error', (err) => { console.log(err.message); });

      this.udpPort.on('ready', () => {
        this.udpPortReady = true;
        resolve();
      });

      //------------------------------------------------------------------------
      // listen to incoming messages (add new devices when noticed)

      this.udpPort.on('message', ({ address, args }, timeTag, info) => {
        if ([ '/movuino', '/streamo' ].indexOf(address) === -1) return;

        const id = `${args[0]}@${info.address}:${info.port}`;

        let idIsNew = false;
        let portIsNew = false;
        let prevPort;

        if (!this.wifiDevices.has(id)) {
          idIsNew = true;
        } else {
          prevPort = this.wifiDevices.get(id).info.port;
        }

        this.wifiDevices.set(id, {
          lastMessageDate: Date.now(),
          info: info,
        });

        if (idIsNew); // wifiConnections changed

        // emit id for movuino filter and 'osc' for incoming messages
        this.udpPort.emit(id, { address: address, args: args }, timeTag, info);
        this.emit('osc', 'wifi', { address: address, args: args }, timeTag, info);
      });

      this.udpPort.open();

      //------------------------------------------------------------------------
      // watch lost devices (after this.wifiConnectionTimeout ms)

      this.interval = setInterval(() => {
        const now = Date.now();
        let connectionsChanged = false;

        this.wifiDevices.forEach((value, key, map) => {
          if (now - value.lastMessageDate > this.wifiConnectionTimeout) {
            this.wifiDevices.delete(key);
            connectionsChanged = true;
          }
        });

        if (connectionsChanged); // eventually do something
      }, this.wifiConnectionTimeout * 0.5);
    });
  }

  //==========================================================================//

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

  broadcastOscMessage(message) {
    this.wifiDevices.forEach((value, key, map) => {
      this.udpPort.send(message, value.info.address, value.info.port);
    });    
  }

  getUDPPort() {
    return this.udpPort;
  }
};

const instance = new Wifi();

export default instance;