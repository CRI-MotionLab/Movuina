const config = {

  //*
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
  },

  /*
  src: {
    root: 'src',
    app: 'app',
    client: 'client',
    shared: 'shared',
    styles: 'styles',
    views: 'views',
    contents: 'views/contents',
  },
  assets: {
    root: 'assets',
    contents: 'contents',
    fonts: 'fonts',
    images: 'images',
  },
  dist: {
    root: 'dist',
    app: 'app',
    client: 'client',
    shared: 'shared',
    public: {
      root: 'public',
      css: 'css',
      fonts: 'fonts',
      images: 'images',
      js: 'js',
    },
    views: 'views',
  },
  //*/

  /*
  app: {
    stylePrefix: 'public/css',
    scriptPrefix: 'app',

    routes: {

    }
  },

  client: {

  },

  server: {

  },
  //*/

  srcDir: 'src',
  distDir: 'dist',
  sharedSrcDir: 'src/shared',
  sharedDistDir: 'dist/shared',
  viewsDir: 'views',
  sassDir: 'styles',
  cssDir: 'dist/public/css',
  mdContentsDir: 'contents',
  viewsContentsDir: 'views/contents',

  //======================================================================== APP

  app: {
    srcDir: 'src/app',
    distDir: 'dist/app',
    publicDir: 'dist/app',
    stylePrefix: 'public/css',
    scriptPrefix: './app',

    routes: {
      main: {
        route: '/',
        template: 'app/main',
        style: 'main',
        script: 'movuino',
        data: {
          title: 'Movuino',
        },
      }
    },

    //=================================================================== SERVER

    server: {
      port: 8000,
      targetIP: '127.0.0.1',

      routes: {
        main: {
          route: '/',
          template: 'client/main',
          data: {
            title: 'main',
          },
        }
      }
    }

  },

  //==================================================================== CLIENTS

  client: {
    srcDir: 'src/client',
    distDir: 'dist/client',
    publicDir: 'dist/public',
    bundleDir: 'dist/public/js',
    minify: false,
    stylePrefix: 'css',
    scriptPrefix: 'js',
  }
};

module.exports = config;