const config = {

  //============================== directories ===============================//

  paths: {
    src: 'src',
    dist: 'dist',
    build: 'build',

    appSrc: 'src/app/app',
    appDist: 'dist/app/app',

    clientSrc: 'src/app/client',
    clientDist: 'dist/app/client',
    clientBundle: 'dist/public/js',

    // interfaceSrc: 'src/interface',
    // interfaceDist: 'dist/interface',
    // interfaceBundle: 'dist/public/js',

    sharedSrc: 'src/app/shared',
    sharedDist: 'dist/app/shared',

    stylesSrc: 'src/styles',
    stylesDist: 'dist/public/css',

    assetsSrc: 'assets',
    assetsDist: 'dist/public',

    contentsSrc: 'src/contents',
    contentsDist: 'dist/contents',

    viewsSrc: 'src/views',
    viewsDist: 'dist/views',

    packageSrc: 'package.json',
    packageDist: 'dist/package.json',

    nodeModules: 'node_modules',
    nodeModulesDist: 'dist/node_modules',

    // create those folders / files automatically

    databaseDist: 'dist/db',
    configDist: 'dist/config.js',
  },

  //=========================== application info =============================//

  dist: {

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

    movuinoOSCServer: {
      localAddress: '0.0.0.0',
      localPort: 7400,
      remoteAddress: '255.255.255.255', // whatever, will be updated
      remotePort: 7401,
    },

    localOSCServer: {
      localAddress: '127.0.0.1',
      localPort: 3001,
      remoteAddress: '127.0.0.1',
      remotePort: 3000,
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

  }, // dist
};

module.exports = config;
