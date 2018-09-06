const fs = require('fs-extra');
const path = require('path');
const watch = require('watch');
const packager = require('electron-packager');
const childProcess = require('child_process');

const util = require('./util');
const transpiler = require('./transpiler');
const App = require('./app');
const logger = require('./logger');

const spawn = childProcess.spawn;

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
const app = new App('dist/app/app/main.js', config);

// ensure paths from config are properly formatted for windows
const pathKeys = Object.keys(paths);
pathKeys.forEach((k) => {
  paths[k] = path.normalize(paths[k]);
});

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

function symLinkAllNodeModulesInDist() {
  // fs.removeSync('dist/node_modules');
  // fs.ensureDir('dist/node_modules');
  // const files = fs.readdirSync('node_modules');
  // files.forEach(function(file) {
  //   fs.ensureSymlink(path.join(cwd, 'node_modules', file), path.join(cwd, 'dist/node_modules', file));
  // });
}

//============================ SCRIPT SELECTOR =============================//

if (process.argv.length > 2) {
  const cmd = process.argv[2];
  if (cmd === 'rebuild') {
    rebuild();
  } else if (cmd === 'build') {
    build().then(package);
  } else if (cmd === 'createWindowsInstaller') {
    createWindowsInstaller();
  } else if (cmd === 'watch') {
    build().then(start);
    watchSource();
  } else if (cmd === 'version') {
    versions();
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
      fs.copy(paths.assetsSrc, paths.assetsDist),
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

function rebuild() {
  switch (process.platform) {
    case 'win32':
      spawn('.\\node_modules\\.bin\\electron-rebuild.cmd', [ '-o', 'serialport,xmm-node' ], {
        stdio: [ process.stdin, process.stdout, process.stderr ],
      });
      break;
    default:
      spawn('electron-rebuild', [ '-o', 'xmm-node' ], {
        stdio: [ process.stdin, process.stdout, process.stderr ],
      });
      break;
  }
}

function versions() {
  let electron;
  switch (process.platform) {
    case 'win32':
      electron = '.\\node_modules\\.bin\\electron.cmd';
      break;
    default:
      electron = 'electron';
      break;
  }

  spawn(electron, [ 'bin/versions.js', null ], {
    stdio: [ 'pipe', process.stdout, process.stderr ],
  });
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
//================================= PACKAGE ==================================//
//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function package() {
  let iconFilename;

  switch (process.platform) {
    case 'win32':
      iconFilename = 'movuino.ico';
      break;
    default:
      iconFilename = 'movuino.icns';
      break;
  }

  // LIKE THIS, ONLY THE SYMLINK GETS COPIED SO THE PACKAGE DOESN'T WORK
  // fs.removeSync(distNodeModulesPath);
  // fs.ensureSymlink(nodeModulesPath, distNodeModulesPath)
  // .then(() => {
  //   return packager({
  //     dir: paths.dist,
  //     name: distConfig.app.name,
  //     out: paths.build,
  //     overwrite: true,
  //     icon: path.join(paths.assetsSrc, iconFilename),
  //   });
  // })
  // .then((appPaths) => { console.log(appPaths); });

  // issue fixed thanks to
  // https://github.com/electron-userland/electron-packager/issues/527
  // (was packaging symlink to node_modules, not original node_module folder into the build)

  // LIKE THIS, NO PROBLEM
  fs.removeSync(paths.nodeModulesDist);
  fs.copySync(paths.nodeModules, paths.nodeModulesDist);
  packager({
    dir: paths.dist,
    name: distConfig.app.name,
    out: paths.build,
    overwrite: true,
    icon: path.join(paths.assetsSrc, iconFilename),
    asar: true,
  })
  .then((appPaths) => {
    console.log(appPaths);
    // createWindowsInstaller();
  });
}

function createWindowsInstaller() {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      var electronInstaller = require('electron-winstaller');

      electronInstaller.createWindowsInstaller({
        appDirectory: path.join(cwd, 'build/Movuina-win32-x64'),
        outputDirectory: path.join(cwd, 'build/Movuina-installer-win32-x64'),
        authors: 'Joseph Larralde, Adrien husson',
        owners: 'CRI Paris',
        exe: 'Movuina.exe',
        iconUrl: 'https://raw.githubusercontent.com/CRI-MotionLab/Movuina/master/assets/movuino.ico',
        setupExe: 'MovuinaSetup.exe',
        setupIcon: path.join(paths.assetsSrc, 'movuino.ico'),
        loadingGif: path.join(paths.assetsSrc, 'movuino.gif'),
        noMsi: true,
      })
      .then(() => {
        console.log("It worked!");
        resolve();
      }, (e) => {
        console.log(`No dice: ${e}`);
      });        
    } else {
      resolve();
    }
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

  //======================= WATCH VIEWS AND ASSETS ===========================//

  const onAssetsChange = function(f, src, dist) {
    logger.startTwirling();

    const task = `copying file ${f} to ${f.replace(src, dist)}`;
    logger.notifyStartTask(task);
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

  watch.createMonitor(paths.assetsSrc, {
    filter: filterExtensions([ 'ejs' ])
  }, function(monitor) {
    monitor.on('created', function(f) { onAssetsChange(f, paths.assetsSrc, paths.assetsDist); });
    monitor.on('changed', function(f) { onAssetsChange(f, paths.assetsSrc, paths.assetsDist); });
    monitor.on('removed', function(f) {
      fs.removeSync(f.replace(paths.assetsSrc, paths.assetsDist));
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
    updateSharedSrcDirTree();
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
