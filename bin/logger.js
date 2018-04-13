const colors = require('colors');

// https://stackoverflow.com/questions/34848505/how-to-make-a-loading-animation-in-console-application-written-in-javascript-or

const interval = 100;
const bars = ["\\", "|", "/", "-"];

let x = 0;
let cnt = 0;
let daemon = null;
let color = 'white';

function setColor(c) {
  color = c;
}

function startTwirling() {
  if (cnt === 0) {
    daemon = setInterval(function() {
      process.stdout.write(colors[color]("\r" + bars[x++]));
      x &= 3;
    }, interval);
  }

  cnt++;
}

function stopTwirling() {
  cnt = cnt > 0 ? cnt - 1 : 0;

  if (cnt === 0) {
    if (daemon !== null) {
      clearInterval(daemon);
      process.stdout.write("\r");
      daemon = null;
    }
  }
}

function log(message) {
  console.log(colors[color](message));
}

function notifyStartTask(task) {
  setColor('yellow');
  log(`${task} ...`);
}

function notifyTaskError(task, err) {
  setColor('red');
  log(`... error ${task}`);
  log(`${err}`);
}

function notifyDone() {
  setColor('green');
  log('... done');
}

function notifyAppTask(task) {
  setColor('cyan');
  log(task);
}

module.exports = {
  startTwirling,
  stopTwirling,
  notifyStartTask,
  notifyTaskError,
  notifyDone,
  notifyAppTask,
};