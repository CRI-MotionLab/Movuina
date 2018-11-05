const config = {
  drivers: {
    downloadPageUrl: 'https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers',
    downloadUrl: 'https://www.silabs.com/documents/public/software/Mac_OSX_VCP_Driver.zip',
  },

  //------------------------------ application -----------------------------//

  app: {
    name: 'Movuina',
    root: '', // for relative paths (images in views etc)
    stylePrefix: 'public/css',
    scriptPrefix: 'app',

    routes: {
      main: {
        template: 'app/main',
        data: {
          title: 'Movuina',
          style: 'main',
          script: 'interface',
        }
      },
    },
  },

  //------------------------------ client pages ----------------------------//

  client: {
    minify: false,
    stylePrefix: 'css',
    scriptPrefix: 'js',
  },

  //--------------------------------- servers ------------------------------//

/*
 * From the MPU6050 library docs :
 * 0 = +/- 2g
 * 1 = +/- 4g
 * 2 = +/- 8g
 * 3 = +/- 16g
 *
 * 0 = +/- 250 degrees/sec
 * 1 = +/- 500 degrees/sec
 * 2 = +/- 1000 degrees/sec
 * 3 = +/- 2000 degrees/sec
 */
  movuinoSettings: {
    accelRange: 3,
    gyroRange: 3,
  },

  movuinoOscServer: {
    localAddress: '0.0.0.0',
    localPort: 7400,
    remoteAddress: '255.255.255.255', // whatever, will be updated
    remotePort: 7401,
  },

  localOscServer: {
    localAddress: '127.0.0.1',
    localPort: 3001,
    remoteAddress: '127.0.0.1',
    remotePort: 3000,
    metadata: true,
  },

  webServer: {
    root: '', // for relative paths (images in views etc)
    port: 8000,
    targetIP: '127.0.0.1',

    publicPath: 'dist/public',

    menus: {
      // define some menus here
    },

    routes: {
      main: {
        // eventually use some previously defined menus here
        route: '/',
        template: 'client/main',
        data: {
          style: 'main',
          script: 'main',
          title: 'main',
        },
      },
    },
  },
};

export default config;
