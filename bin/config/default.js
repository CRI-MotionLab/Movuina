const config = {

  //============================== directories ===============================//

  paths: {
    src: 'src',
    dist: 'dist',
    build: 'build',

    appSrc: 'src/app',
    appDist: 'dist/app',

    clientSrc: 'src/client',
    clientDist: 'dist/client',
    clientBundle: 'dist/public/js',

    sharedSrc: 'src/shared',
    sharedDist: 'dist/shared',

    stylesSrc: 'src/styles',
    stylesDist: 'dist/public/css',

    fontsSrc: 'assets/fonts',
    fontsDist: 'dist/public/fonts',

    mediaSrc: 'assets/media',
    mediaDist: 'dist/public/media',

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
            title: 'Movuino',
            style: 'main',
            script: 'movuino',
          }
        },
      },
    },

    //------------------------------ client pages ----------------------------//

    client: {
      minify: true,
      stylePrefix: 'css',
      scriptPrefix: 'js',
    },

    //--------------------------------- server -------------------------------//

    server: {
      root: '', // for relative paths (images in views etc)
      port: 8000,
      targetIP: '127.0.0.1',

      publicPath: 'dist/public',

      osc: {
        port: 7000,
        // To complete
      },

      routes: {
        main: {
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
