import EventEmitter from 'events';
import http from 'http';
import path from 'path';

import fs from 'fs-extra';
import ejs from 'ejs';
import express from 'express';
import serveFavicon from 'serve-favicon';
import compression from 'compression';

const cwd = process.cwd();
// root path, here 'src', once transpiled 'dist'
const distPath = path.join(__dirname, '../../..');
const publicPath = path.join(distPath, 'public');

//============================================================================//
// this code used to be in the build directory as "MyServer"

class WebServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.port = this.config.dist.webServer.port;
    this.routes = this.config.dist.webServer.routes;

    this.app = express();
    const app = this.app;

    app.use(serveFavicon(path.join(publicPath, 'favicon.ico')));
    app.use(compression());
    app.use(express.static(publicPath, {
      extensions: ['css', 'js', 'JPG', 'JPEG', 'jpg', 'jpeg', 'PNG', 'png']
    }));
    app.set('view engine', 'ejs');

    for (let r in this.routes) {
      this.routes[r].config = process.env;
      app.get(this.routes[r]['route'], function (req, res) {
        res.render(this.routes[r].template, this.routes[r]);
      });
    };

    app.use(function (req, res) {
      res.render(this.routes['notfound'].template, this.routes['notfound']);
    });

    this.server = http.createServer(this.app);
  }

  start() {
    this.server.listen(this.port, function () {
      console.log('Server started: http://127.0.0.1:' + this.port);
    });
  }

  stop() {
    this.server.close();
  }

  restart() {
    this.stop();
    this.start();
  }
};

export default WebServer;