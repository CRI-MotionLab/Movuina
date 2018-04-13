const fs = require('fs-extra');
const path = require('path');
const watch = require('watch');
const packager = require('electron-packager');

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

const cwd = process.cwd();
const configName = process.argv[3] || 'default';
const config = require(`./config/${configName}`);
const paths = config.paths;
const distConfig = config.dist;
const configPath = `bin/config/${configName}.js`;
const app = new App('dist/app/main.js', config);

//======================== FOLDER STRUCTURE HOLDERS ==========================//

let sassFiles;
let mdFiles;
let clientSrcFiles;
let appSrcFiles;
let sharedSrcFiles;

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

function updateAppSrcDirTree() {
  appSrcFiles = createDirTree(paths.appSrc, {
    filter: filterExtensions([ 'js' ])
  });
}

function updateSharedSrcDirTree() {
  sharedSrcFiles = createDirTree(paths.sharedSrc, {
    filter: filterExtensions([ 'js' ])
  });
}

function copyPackageAndConfigFile() {
  fs.copySync(paths.packageSrc, paths.packageDist);
  fs.copySync(configPath, paths.configDist);
}

//============================ SCRIPT SELECTOR =============================//

if (process.argv.length > 2) {
  if (process.argv[2] === 'build') {
    build().then(package);
  } else if (process.argv[2] === 'watch') {
    build().then(start);
    watchSource();
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
      transpiler.renderEjsFilesFromMarkdown(mdFiles, paths.contentsSrc, paths.contentsDist, distConfig),
      transpiler.transpileFileAndChildren(clientSrcFiles, paths.clientSrc, paths.clientDist),
      transpiler.transpileFileAndChildren(appSrcFiles, paths.appSrc, paths.appDist),
      transpiler.transpileFileAndChildren(sharedSrcFiles, paths.sharedSrc, paths.sharedDist),
      fs.copy(paths.viewsSrc, paths.viewsDist),
      fs.copy(paths.fontsSrc, paths.fontsDist),
      fs.copy(paths.mediaSrc, paths.mediaDist),
    ])
    .then(function() {
      transpiler.bundleFileAndChildren(clientSrcFiles, paths.clientSrc, paths.clientDist, paths.clientBundle, distConfig);
    })
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
      resolve();
    });
  });
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================= PACKAGE ==================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function package() {
  const nodeModulesPath = path.join(cwd, 'node_modules');
  fs.removeSync('dist/node_modules');
  fs.ensureSymlink(nodeModulesPath, 'dist/node_modules')
  .then(() => {
    return packager({
      dir: paths.dist,
      name: distConfig.app.name,
      out: paths.build,
      overwrite: true,
    });
  })
  .then((appPaths) => { console.log(appPaths); });
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

  //=================== WATCH VIEWS, MEDIA AND FONTS =========================//

  const onAssetsChange = function(f, src, dist) {
    logger.startTwirling();

    fs.copy(f, f.replace(src, dist))
    .then(function() {
      logger.stopTwirling();
      logger.notifyDone();
    });
  };

  watch.createMonitor(paths.viewsSrc, {
    filter: filterExtensions([ 'ejs' ])
  }, function(monitor) {
    monitor.on('created', function(f) { onAssetsChange(f, paths.viewsSrc, paths.viewsDist); });
    monitor.on('changed', function(f) { onAssetsChange(f, paths.viewsSrc, paths.viewsDist); });
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.viewsSrc, paths.viewsDist));
    });
  });

  watch.createMonitor(paths.mediaSrc, {
    filter: filterExtensions([ 'ejs' ])
  }, function(monitor) {
    monitor.on('created', function(f) { onAssetsChange(f, paths.mediaSrc, paths.mediaDist); });
    monitor.on('changed', function(f) { onAssetsChange(f, paths.mediaSrc, paths.mediaDist); });
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.mediaSrc, paths.mediaDist));
    });
  });

  watch.createMonitor(paths.fontsSrc, {
    filter: filterExtensions([ 'ejs' ])
  }, function(monitor) {
    monitor.on('created', function(f) { onAssetsChange(f, paths.fontsSrc, paths.fontsDist); });
    monitor.on('changed', function(f) { onAssetsChange(f, paths.fontsSrc, paths.fontsDist); });
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.fontsSrc, paths.fontsDist));
    });
  });

  //=========================== WATCH CONTENTS ===============================//

  const onContentsChange = function(f) {
    updateContentsDirTree();
    const file = getFileFromFilename(f, mdFiles);
    logger.startTwirling();

    transpiler.renderEjsFilesFromMarkdown(file, paths.contentsSrc, paths.contentsDist, distConfig)
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
      transpiler.bundleFileAndParents(file, paths.clientSrc, paths.clientDist, paths.clientBundle, distConfig);
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
      transpiler.bundleFileAndParents(file, paths.clientSrc, paths.clientDist, paths.clientBundle, distConfig);
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
