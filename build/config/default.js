const config = {

  paths: {
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

    contentsSrc: 'assets/contents',
    contentsDist: 'dist/views/contents',

    viewsSrc: 'src/views',
    viewsDist: 'dist/views',

    packageSrc: 'src/package.json'
    packageDist: 'dist/package.json',

    // create those folders / files automatically

    databaseDist: 'dist/db',
    configDist: 'dist/config.js',
  },

  dist: {

    app: {
      stylePrefix: 'public/css',
      scriptPrefix: 'app',

      routes: {
        main: {
          template: 'app/main',
          style: 'main',
          script: 'main',
        }
      }
    },

    client: {
      minify: true,
      stylePrefix: 'css',
      scriptPrefix: 'js',
    },

    osc: {
      port: 7000,

    }

    server: {
      port: 8000,
      targetIP: '127.0.0.1',

      routes: {
        main: {
          route: '/',
          template: 'client/main',
          style: 'main',
          script: 'main',
          data: {
            title: 'main',
          },
        }
      },
    },

  }, // dist
};

module.exports = config;
