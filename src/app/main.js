import { app } from 'electron';
import Renderer from './renderer';
import config from '../config'; // this is just a copy of build/config/used_config.js
// import server from './server';

const renderer = new Renderer(config);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  renderer.createWindows();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // kill server, do
  renderer.deleteWindows();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  renderer.createWindows();
});


// this is for development only, to allow restarting electron on each
// project modification, but does no harm remaining here.
process.stdin.on('data', (msg) => {
  switch (msg.toString()) {
    case 'reload':
      // todo: reload app ?
      break;
    case 'quit':
      app.quit();
      break;
    case 'server:restart':
      // todo: restart server ?
      break;
    default:
      break;
  }
});
