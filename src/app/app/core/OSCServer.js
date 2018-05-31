import EventEmitter from 'events';
import osc from 'osc';
import { getMyIP } from './util';

//=========================== BASIC UDP OSC SERVER ===========================//

class BaseOSCServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.server = null;
    this.ready = false;
  }

  stop() {
    if (this.server !== null && this.ready) {
      this.server.close((err) => {
        console.error(err.stack);
      });
    }
  }

  restart(args) {
    Object.assign(this.config, args);
    // console.log(JSON.stringify(this.config, null, 2));

    if (this.server !== null && this.ready) {
      this.server.close((err) => {
        console.error(err.stack);
      });
    }

    this.server = new osc.UDPPort({
      localAddress: this.config.localAddress,
      localPort: this.config.localPort,
      remoteAddress: this.config.remoteAddress,
      remotePort: this.config.remotePort,
    });

    this.server.open();

    this.server.on('ready', () => {
      this.ready = true;
    });

    this.server.on('message', (msg) => {
      this.emit('oscmessage', Object.assign(msg, { port: this.config.localPort }));
    });

    this.server.on('close', () => {
      this.ready = false;
    });
  }

  send(address, args) {
    if (this.ready) {
      const msg = {
        address: address,
        args: []
      };

      for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === 'number') {
          msg.args.push({ type: 'f', value: args[i] });
        } else if (typeof args[i] === 'string') {
          msg.args.push({ type: 's', value: args[i] });
        } else {
          msg.args.push({ type: 's', value: `${args[i]}` });
        }
      }

      this.server.send(msg);
      this.emit('oscmessage', {
        address: address,
        args: args,
        port: this.config.remotePort,
      });
    }
  }
};

//========================== META OSC SERVER / HUB ===========================//

class OSCServer extends EventEmitter {
  constructor(config) {
    super();
    this.movuinoServer = new BaseOSCServer(config.dist.movuinoOSCServer);
    this.localServer = new BaseOSCServer(config.dist.localOSCServer);

    this.routeOSCMessage = this.routeOSCMessage.bind(this);
    this.movuinoServer.on('oscmessage', (msg) => this.routeOSCMessage('movuino', msg));
    this.localServer.on('oscmessage', (msg) => this.routeOSCMessage('local', msg));

    this.triggers = new Map();
    this.oscId = null;

    // received by udp servers

    this.receive('movuino', '/sensors', (msg) => {
      this.emit('renderer', 'display', { target: 'movIn', msg: msg });
      this.emit('renderer', 'control', { target: 'sensors', msg: msg });
    });

    this.receive('local', '/vibroPulse', (msg) => {
      this.emit('renderer', 'display', { target: 'localIn', msg: msg });
      this.emit('renderer', 'control', { target: 'vibroPulse', msg: msg });
    });

    this.receive('local', '/vibroNow', (msg) => {
      this.emit('renderer', 'display', { target: 'localIn', msg: msg });
      this.emit('renderer', 'control', { target: 'vibroNow', msg: msg });
    });

    // emitted by sends

    this.receive('movuino', '/vibroPulse', (msg) => {
      this.emit('renderer', 'display', { target: 'movOut', msg: msg });
    });

    this.receive('movuino', '/vibroPulse', (msg) => {
      this.emit('renderer', 'display', { target: 'movOut', msg: msg });
    });

    this.receive('local', '/filteredSensors', (msg) => {
      this.emit('renderer', 'display', { target: 'localOut1', msg: msg });
    });

    this.receive('local', '/repetitions', (msg) => {
      this.emit('renderer', 'display', { target: 'localOut2', msg: msg });
    });

    this.localServer.restart({ localAddress: getMyIP() });
  }

  executeCommand(cmd, args) {
    if (cmd === 'stopMovuinoServer') {
      this.movuinoServer.stop();
    } else if (cmd === 'restartMovuinoServer') {
      this.movuinoServer.restart(args);
    } else if (cmd === 'oscid') {
      this.oscId = args;
    } else if (cmd === 'sendOSC') {
      this.send(args.target, args.msg);
    }
  }

  routeOSCMessage(server, msg) {
    // if (server === 'local' && msg.address !== '/mov1/filteredSensors') {
    //   console.log(msg);
    // }

    let unprefixed = msg.address.split('/');

    // remove empty string due to first slash
    // then remove movuino osc id
    // while checking they're correct at the same time
    if (unprefixed.shift() === '' && unprefixed.shift() === this.oscId) {

      const triggerAddress = `${server}:/${unprefixed.join('/')}`;
      const triggers = this.triggers.get(triggerAddress);

      if (Array.isArray(triggers)) {
        triggers.forEach((callback) => {
          callback(msg);
        });
      }
    }
  }

  send(server, msg) {
    const realAddress = `/${this.oscId}${msg.address}`;
    if (server === 'movuino') {
      this.movuinoServer.send(realAddress, msg.args);
    } else if (server === 'local') {
      this.localServer.send(realAddress, msg.args);
    }
  }

  receive(server, address, callback) {
    const triggerAddress = `${server}:${address}`;

    if (!this.triggers.get(triggerAddress)) {
      this.triggers.set(triggerAddress, [ callback ]);
    } else {
      this.triggers.get(triggerAddress).push(callback);
    }
  }
};

export default OSCServer;
