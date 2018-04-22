import EventEmitter from 'events';
import osc from 'osc';

class OSCServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;

    this.server = new osc.UDPPort({
      localAddress: '127.0.0.1',
      localPort: config.dist.oscServer.portIn,
      remoteAddress: '127.0.0.1',
      remotePort: config.dist.oscServer.portOut,
    });
  }
};

export default OSCServer;
