import http from 'http';
import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';
import serveFavicon from 'serve-favicon';
import compression from 'compression';
import express from 'express';

import routes from './routes';

const cwd = process.cwd();
const port = process.env.port || 3000;
const publicDir = process.env.publicDir || 'public';

const app = express();

app.use(serveFavicon(path.join(cwd, publicDir, 'favicon.ico')));
app.use(compression());
app.use(express.static(path.join(cwd, publicDir), {
  extensions: ['css', 'js', 'JPG', 'JPEG', 'jpg', 'jpeg', 'PNG', 'png']
}));
app.set('view engine', 'ejs');

const server = http.createServer(app).listen(port, function () {
  console.log('Server started: http://127.0.0.1:' + port);
});

function render(res, route) {
  return res.render(route.template, route);
};

for (let r in routes) {
  routes[r].config = process.env;
  app.get(routes[r]['route'], function (req, res) {
    render(res, routes[r]);
  });
};

app.use(function (req, res) {
  render(res, routes['notfound']);
});