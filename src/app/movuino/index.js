import { ipcRenderer as ipc, remote } from 'electron';

ipc.on('cmd', function(e, arg) {
  if (arg === 'toggledevtools') {
    remote.getCurrentWindow().toggleDevTools();
  }
});

window.addEventListener('beforeunload', (e) => {
  ipc.send('cmd', 'refresh');
});

console.log('bonne nuit les petits');

