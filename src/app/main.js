import { app } from 'electron';
import Renderer from './renderer';
// import server from './server';

const config = process.argv[2] ? JSON.parse(process.argv[2]) : require('../config.js');

const renderer = new Renderer(config.app);

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


// this is only for development

process.stdin.on('data', (msg) => {
  switch (msg.toString()) {
    case 'reload':
      // reload app
      break;
    case 'quit':
      app.quit();
      break;
    case 'server:restart':
      // restart server
      break;
    default:
      break;
  }
});
