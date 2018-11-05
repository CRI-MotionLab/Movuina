const config = {
  app: {
    name: 'Movuina',
  },

  src: 'src',
  dist: 'dist',
  build: 'build',

  assetsSrc: 'assets',
  assetsDist: 'dist/browser',

  htmlInput: 'src/browser/index.html',
  htmlOutput: 'dist/browser/index.html',

  sassSrc: 'src/browser/sass',
  sassIncludes: [ 'src/browser/sass' ],
  sassInput: 'src/browser/sass/index.scss',
  cssOutput: 'dist/browser/css/index.css',

  browserSrc: 'src/browser',
  browserDist: 'dist/browser',
  clientSrc: 'src/browser/js',
  clientDist: 'dist/browser/js',
  clientSrcInput: 'src/browser/js/index.js',
  clientSrcOutput: 'dist/browser/js/index.js',

  nodeSrc: 'src/node',
  nodeDist: 'dist/node',
  mainSrcInput: 'src/main.js',
  mainSrcOutput: 'dist/main.js',
  configSrcInput: 'src/config.js',
  configSrcOutput: 'dist/config.js',

  packageInput: 'package.json',
  packageOutput: 'dist/package.json',

  nodeModulesInput: 'node_modules',
  nodeModulesOutput: 'dist/node_modules',
};

module.exports = config;