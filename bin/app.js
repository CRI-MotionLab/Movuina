const http = require('http');
const childProcess = require('child_process');
const logger = require('./logger');

const spawn = childProcess.spawn;

function App(appIndexPath, config) {
  this.appIndexPath = appIndexPath;
  this.app = null;
  this.config = config;
};

App.prototype.start = function() {
  const task = 'starting app';
  logger.notifyAppTask(task);

  let electron;
  switch (process.platform) {
    case 'win32':
      electron = '.\\node_modules\\.bin\\electron.cmd';
      break;
    default:
      electron = 'electron';
      break;
  }

  this.app = spawn(electron, [ `${this.appIndexPath}`, JSON.stringify(this.config) ], {
    stdio: [ 'pipe', process.stdout, process.stderr ],
  });

  this.app.on('close', (code) => {
    // do something when app is closed ...
    // console.log('closed electron app');
    this.app = null;
  });
};

App.prototype.stop = function() {
  return new Promise((resolve, reject) => {
    if (this.app !== null) {
      logger.notifyAppTask('closing app');
      this.app.stdin.write('quit');
      this.app.on('close', (code) => {
        this.app = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

App.prototype.restart = function() {
  this.stop()
  .then(() => {
    this.start();
  });
};

module.exports = App;