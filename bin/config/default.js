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

    // create those folders / files automatically

    databaseDist: 'dist/db',
    configDist: 'dist/config.js',
  },

  //=========================== application info =============================//

  dist: {

    //------------------------------ application -----------------------------//

    app: {
      name: 'Movuinode',
      root: '', // for relative paths (images in views etc)
      stylePrefix: 'public/css',
      scriptPrefix: 'app',

      routes: {
        main: {
          template: 'app/main',
          data: {
            title: 'Movuinode',
            style: 'main',
            script: 'movuino',
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
      localAddress: '127.0.0.1',
      localPort: 9001,
      remoteAddress: '192.168.0.101', // whatever, will be updated
      remotePort: 9000,
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
