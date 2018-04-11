const fs = require('fs-extra');
const path = require('path');
const watch = require('watch');

const util = require('./util');
const transpiler = require('./transpiler');
const App = require('./app');
const logger = require('./logger');

//================================== UTIL ====================================//

const inspect = util.inspect;
const filterExtensions = util.filterExtensions;
const createDirTree = util.createDirTree;
const getFileFromFilename = util.getFileFromFilename;

//================================== PATHS ===================================//

const configName = process.argv[3] || 'default';
const config = require(`./config/${configName}`);
const paths = config.paths;
const configPath = `build/config/${configName}.js`;
const app = new App('dist/app/main.js', config);

//======================== FOLDER STRUCTURE HOLDERS ==========================//

let sassFiles;
let mdFiles;
let clientSrcFiles;
let clientPublicFiles;
let appSrcFiles;
let appPublicFiles;
let sharedSrcFiles;
let sharedPublicFiles;

function updateSassDirTree() {
  sassFiles = createDirTree(paths.stylesSrc, {
    filter: filterExtensions([ 'scss' ])
  });
}

function updateContentsDirTree() {
  mdFiles = createDirTree(paths.contentsSrc, {
    filter: filterExtensions([ 'md' ])
  });
}

function updateClientSrcDirTree() {
  clientSrcFiles = createDirTree(paths.clientSrc, {
    filter: filterExtensions([ 'js' ])
  });
}

/*
function updateClientPublicDirTree() {
  clientPublicFiles = createDirTree(config.client.publicDir, {
    filter: filterExtensions([ 'html' ])
  });
}
//*/

function updateAppSrcDirTree() {
  appSrcFiles = createDirTree(paths.appSrc, {
    filter: filterExtensions([ 'js' ])
  });
}

/*
function updateAppPublicDirTree() {
  appPublicFiles = createDirTree(config.app.publicDir, {
    filter: filterExtensions([ 'html' ])
  });
}
//*/

function updateSharedSrcDirTree() {
  sharedSrcFiles = createDirTree(paths.sharedSrc, {
    filter: filterExtensions([ 'js' ])
  });
}

function copyPackageAndConfigFile() {
  // fs.copySync(path.join(config.srcDir, 'package.json'), path.join(config.distDir, 'package.json'));
  // fs.copySync(configPath, path.join(config.app.publicDir, 'config.js'));
  fs.copySync(paths.packageSrc, paths.packageDist);
  fs.copySync(configPath, config.configDist));
}

//============================ SCRIPT SELECTOR =============================//

if (process.argv.length > 2) {
  if (process.argv[2] === 'watch') {
    build()
    // .then(render)
    .then(start);
    watchSource();
  } else if (process.argv[2] === 'start') {
    build().then(start);
  } else if (process.argv[2] === 'render') {
    build().then(renderHtml);
  }
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================== BUILD ===================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function build() {
  updateSassDirTree();
  updateContentsDirTree()
  updateClientSrcDirTree();
  updateAppSrcDirTree();
  updateSharedSrcDirTree();

  //==========================================================================//
  //==================== TRANSPILE / BUNDLE EVERYTHING =======================//
  //========================== AND START SERVER ==============================//
  //==========================================================================//

  // clean old transpiled / bundled files
  fs.removeSync(paths.stylesDist);
  fs.removeSync(paths.clientBundle);
  fs.removeSync(paths.clientDist);
  fs.removeSync(paths.appDist);

  copyPackageAndConfigFile();

  logger.startTwirling();

  return new Promise(function(resolve, reject) {
    Promise.all([
      // regenerate them from actual source code
      transpiler.renderStyles(sassFiles, paths.stylesSrc, paths.stylesDist),
      transpiler.renderEjsFilesFromMarkdown(mdFiles, paths.contentsSrc, paths.contentsDist, config),
      transpiler.transpileFileAndChildren(clientSrcFiles, paths.clientSrc, paths.clientDist),
      transpiler.transpileFileAndChildren(appSrcFiles, paths.appSrc, paths.appDist),
      transpiler.transpileFileAndChildren(sharedSrcFiles, paths.sharedSrc, paths.sharedDist),
    ])
    .then(function() {
      transpiler.bundleFileAndChildren(clientSrcFiles, paths.clientSrc, paths.clientDist, paths.clientBundle, config);
    })
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
      resolve();
    });
  });
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================= RENDER ===================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function render() {
  return new Promise(function(resolve, reject) {
    updateContentsDirTree();
    updateAppPublicDirTree();
    // updatePublicDirTree();
    // const appRoutes = require('../dist/app/js/routes').default;
    const appPublicDir = config.app.publicDir;
    const appRoutes = config.app.routes;
    // const serverRoutes = require('../dist/app/js/server/routes').default;
    logger.startTwirling();

    transpiler.removeHtmlFiles(appPublicFiles);
    transpiler.renderHtmlFiles(appRoutes, appPublicDir, config.app)
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
      resolve();
    });
  });
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================== START ===================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function start() {
  app.start();
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================== WATCH ===================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function watchSource() {

  //============================ WATCH STYLES ================================//

  const onStylesChange = function(f) {
    updateSassDirTree();
    logger.startTwirling();

    transpiler.renderStyles(sassFiles, paths.stylesSrc, paths.stylesDist)
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
    });
  };

  watch.createMonitor(paths.stylesSrc, {
    filter: filterExtensions([ 'scss' ])
  }, function(monitor) {
    monitor.on('created', onStylesChange);
    monitor.on('changed', onStylesChange);
    monitor.on('removed', function(f) {});
  });

  //============================= WATCH VIEWS ================================//

  /*
  const onViewsChange = function(f) {
    logger.startTwirling();

    transpiler.renderViews(viewsDir, clientPublicDir)
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
    });
  };

  watch.createMonitor(viewsDir, {
    filter: filterExtensions([ 'ejs' ])
  }, function(monitor) {
    monitor.on('created', onViewsChange);
    monitor.on('changed', onViewsChange);
    monitor.on('removed', function(f) {});
  });
  //*/

  //=========================== WATCH CONTENTS ===============================//

  const onContentsChange = function(f) {
    updateContentsDirTree();
    const file = getFileFromFilename(f, mdFiles);
    logger.startTwirling();

    transpiler.renderEjsFilesFromMarkdown(file, paths.contentsSrc, paths.contentsDist, config)
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
    });
  };

  watch.createMonitor(paths.contentsSrc, {
    filter: filterExtensions([ 'md' ])
  }, function(monitor) {
    monitor.on('created', onContentsChange);
    monitor.on('changed', onContentsChange);
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.contentsSrc, paths.contentsDist));
    });
  });

  //=========================== WATCH CLIENT SRC =============================//

  const onClientSrcChange = function(f) {
    updateClientSrcDirTree();
    const file = getFileFromFilename(f, clientSrcFiles);
    logger.startTwirling();

    transpiler.transpileFile(file, paths.clientSrc, paths.clientDist)
    .then(function() {
      transpiler.bundleFileAndParents(file, paths.clientSrc, paths.clientDist, paths.clientBundle, config);
    })
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
    });
  };

  watch.createMonitor(paths.clientSrc, {
    filter: filterExtensions([ 'js' ])
  }, function(monitor) {
    monitor.on('created', onClientSrcChange);
    monitor.on('changed', onClientSrcChange);
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.clientSrc, paths.clientDist));
      fs.removeSync(f.replace(paths.clientSrc, paths.clientBundle));
    });
  });

  //============================ WATCH APP SRC ===============================//

  const onAppSrcChange = function(f) {
    updateAppSrcDirTree();
    const file = getFileFromFilename(f, appSrcFiles);
    logger.startTwirling();

    transpiler.transpileFile(file, paths.appSrc, paths.appDist)
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
      app.restart();
    });
  };

  watch.createMonitor(paths.appSrc, {
    filter: filterExtensions([ 'js' ])
  }, function(monitor) {
    monitor.on('created', onAppSrcChange);
    monitor.on('changed', onAppSrcChange);
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.appSrc, paths.appDist));
    });
  });

  //=========================== WATCH SHARED SRC =============================//

  const onSharedSrcChange = function(f) {
    updatedSharedSrcDirTree();
    const file = getFileFromFilename(f, sharedSrcFiles);
    logger.startTwirling();

    transpiler.transpileFile(file, paths.sharedSrc, paths.sharedDist)
    .then(function() {
      // in case client code depends on shared code
      transpiler.bundleFileAndParents(file, paths.clientSrc, paths.clientDist, paths.clientBundle, config);
    })
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
      // in case app code depends on shared code
      app.restart();
    });
  }

  watch.createMonitor(paths.sharedSrc, {
    filter: filterExtensions([ 'js' ])
  }, function(monitor) {
    monitor.on('created', onSharedSrcChange);
    monitor.on('changed', onSharedSrcChange);
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.sharedSrc, paths.sharedDist));
    });
  });
}
