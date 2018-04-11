// this file used to be in the build directory

const http = require('http');
const childProcess = require('child_process');
const logger = require('./logger');

const fork = childProcess.fork;

function MyServer(serverIndexPath, config) {
  this.serverIndexPath = serverIndexPath;
  this.server = null;
  this.config = config;
};

MyServer.prototype.start = function() {
  const task = 'starting server';
  logger.notifyServerTask(task);

  this.server = fork(this.serverIndexPath, [], {
    env: this.config,
    // leave default values (comment out stdio) and comment out this.server's
    // stderr / stdout .on('data') callbacks to let the child process pipe its
    // output to the main console :

    // stdio: [ 'ignore', childProcess.stdout, childProcess.stderr, 'ipc' ]
  });
};

MyServer.prototype.stop = function() {
  if (this.server !== null) {
    logger.notifyServerTask('killing server');
    this.server.kill();
    this.server = null;
  }
};

MyServer.prototype.restart = function() {
  this.stop();
  this.start();
};

module.exports = MyServer;