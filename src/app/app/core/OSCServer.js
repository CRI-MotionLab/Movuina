import EventEmitter from 'events';
import osc from 'osc';

class OSCServer extends EventEmitter {
  constructor(config) {
    super();
    this.server = null;
    this.config = config.dist.oscServer;
    this.triggers = new Map();
    // this.restartServer();
  }

  executeCommand(cmd, args) {
    if (cmd === 'stop') {
      this.stopServer();
    } else if (cmd === 'restart') {
      // console.log(args);
      console.log(`restarting server with ports ${args.localPort} and ${args.remotePort}, hostIP ${args.localAddress}, remoteIP ${args.remoteAddress}`);
      Object.assign(this.config, args);
      this.restartServer();
    } else if (cmd === 'movuinoid') {
      console.log(`updating movuino osc identifier to "${args}"`);
      this.clearTriggers();
      this.receive(`/${args}/sensors`, (sensors) => {
        // console.log('Wouhou ! I\'m receiving sensor values : ' + sensors);
        const typedArgs = [];
        for (let i = 0; i < sensors.length; i++) {
          typedArgs.push({ type: 'f', value: sensors[i] });
        }

        this.emit('oscmessage', 'input', {
          address: `/${args}/sensors`,
          port: this.config.localPort,
          args: typedArgs,
        });
      });
    }
  }

  stopServer() {
    if (this.server !== null && this.ready) {
      this.server.close((err) => {
        console.error(err.stack);
      });
    }
  }

  restartServer() {
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
      const triggers = this.triggers.get(msg.address);

      if (Array.isArray(triggers)) {
        triggers.forEach((callback) => {
          callback(msg.args);
        });
      }
    });

    this.server.on('close', () => {
      this.ready = false;
      //console.log('osc server closed');
    });
  }

  send(address, args) {
    if (this.ready) {
      const packet = {
        address: address,
        args: []
      };

      for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === 'number') {
          packet.args.push({ type: 'f', value: args[i] });
        } else if (typeof args[i] === 'string') {
          packet.args.push({ type: 's', value: args[i] });
        } else {
          packet.args.push({ type: 's', value: `${args[i]}` });
        }
      }

      this.server.send(packet);
    }
  }

  clearTriggers() {
    this.triggers = new Map();
  }

  receive(cmd, callback) {
    if (!this.triggers.get(cmd)) {
      this.triggers.set(cmd, [ callback ]);
    } else {
      this.triggers.get(cmd).push(callback);
    }
  }
};

export default OSCServer;
