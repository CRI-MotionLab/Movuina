import EventEmitter from 'events';
import { app, systemPreferences } from 'electron';

class AppMenu extends EventEmitter {
  constructor() {
    super();
    this.menu = null;
    this.menuTemplate = [
      {
        label: 'Edit',
        submenu: [
          // {role: 'undo'},
          // {role: 'redo'},
          // {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          // {role: 'pasteandmatchstyle'},
          // {role: 'delete'},
          {role: 'selectall'}
        ]
      },
      {
        label: 'View',
        submenu: [
          {role: 'reload'},
          {role: 'forcereload'},
          {role: 'toggledevtools'},

          {type: 'separator'},
          {
            id: 'toggle-osc-connections',
            label: 'Show OSC Connections',
            type: 'checkbox',
            // accelerator: 'CommandOrControl+C',
            // click: () => { callbacks.toggleOSCConnection(this.menu); },
            click: (item, BrowserWindow) => {
              this.emit('showOSCConnections', item.checked);
              // console.log(item.checked);
            },
          },

          {type: 'separator'},
          {role: 'resetzoom'},
          {role: 'zoomin'},
          {role: 'zoomout'},

          {type: 'separator'},
          {role: 'togglefullscreen'}
        ]
      },
      {
        role: 'window',
        submenu: [
          {role: 'minimize', accelerator: null},
          {role: 'close', accelerator: null}
        ]
      },
      // {
      //   label: 'Devices',
      //   submenu: [
      //     {
      //       id: 'add-movuino-device',
      //       label: 'Add Movuino Device',
      //       type: 'normal',
      //       accelerator: 'CommandOrControl+T',
      //       click: (item, BrowserWindow) => {
      //         this.emit('device' ,'add');
      //       }
      //     },
      //     {
      //       id: 'remove-movuino-device',
      //       label: 'Remove Movuino Device',
      //       type: 'normal',
      //       accelerator: 'CommandOrControl+W',
      //       click: (item, BrowserWindow) => {
      //         this.emit('device', 'removecurrent');
      //       }
      //     },
      //     {
      //       id: 'next-movuino-device',
      //       label: 'Next Movuino Device',
      //       type: 'normal',
      //       accelerator: 'Control+Tab',
      //       click: (item, BrowserWindow) => {
      //         this.emit('device', 'next');
      //       }
      //     }
      //   ]
      // },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click () { require('electron').shell.openExternal('https://electronjs.org') }
          }
        ]
      },
    ];
  }

  getMenuTemplate() {
    if (process.platform === 'darwin') {

      // this is explained here (allows to make Edit menu totally empty) :
      // https://github.com/electron/electron/issues/8283
      systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
      systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)

      this.menuTemplate.unshift({
        label: app.getName(),
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {role: 'services', submenu: []},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'}
        ]
      })

      // Edit menu
      // this.menuTemplate[1].submenu.push(
      //   {type: 'separator'},
      //   {
      //     label: 'Speech',
      //     submenu: [
      //       {role: 'startspeaking'},
      //       {role: 'stopspeaking'}
      //     ]
      //   }
      // );

      // Window menu
      this.menuTemplate[3].submenu = [
        {role: 'close'},
        {role: 'minimize'},
        {role: 'zoom'},
        {type: 'separator'},
        {role: 'front'}
      ];
    }

    return this.menuTemplate;
  }

  initMenu(menu) {
    const item = menu.getMenuItemById('toggle-osc-connections');
    item.checked = true;
    this.emit('showOSCConnections', item.checked);
  }
};

const appMenu = new AppMenu();

export default appMenu;