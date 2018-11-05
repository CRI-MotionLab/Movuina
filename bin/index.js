const fs = require('fs-extra');
const path = require('path');
const watch = require('watch');
const packager = require('electron-packager');
const childProcess = require('child_process');

const App = require('./app');
const logger = require('./logger');
const transpiler = require('./transpiler');
const config = require('./config');

const cwd = process.cwd();
const spawn = childProcess.spawn;

const app = new App('dist/main.js', {});

function filterExtensions(extensions) {
  return function(filename) {
    const regex = new RegExp(`^(.+\\.(${extensions.join('|')})|[^\\.]*)$`);
    return regex.test(filename);
  }
};

//----------------------------------------------------------------------------//

const cmd = process.argv[2];

if (cmd === 'watch') {
  build().then(start);
  watchFiles();
} else if (cmd === 'build') {
  build().then(package);
} else if (cmd === 'rebuild') {
  rebuild();
} else if (cmd === 'createWindowsInstaller') {
  createWindowsInstaller();
} else if (cmd === 'version') {
  versions();
}

function build() {
  fs.copySync(config.htmlInput, config.htmlOutput);
  fs.copySync(config.assetsSrc, config.assetsDist);
  fs.copySync(config.packageInput, config.packageOutput);

  return Promise.all([
    transpiler.renderCss(),
    transpiler.renderBrowserCode(),
    transpiler.renderNodeCode(),
  ]);
}

function watchFiles() {
  // attach callback to all monitor triggers
  function setMonitorCallback(monitor, callback) {
    [ 'created', 'changed', 'removed' ].forEach(function(e) {
      monitor.on(e, callback);
    });
  }

  // watch src/browser/index.html
  watch.createMonitor(config.browserSrc, {
    filter: filterExtensions([ 'html' ])
  }, function(monitor) {
    setMonitorCallback(monitor, function(file) {
      console.log(file);
      if (file === config.htmlInput) {
        const task = `copying ${config.htmlInput} file to ${config.htmlOutput}`;
        logger.notifyStartTask(task);
        fs.copySync(config.htmlInput, config.htmlOutput);
        logger.notifyDone();
      }
    });
  });

  // watch assets
  watch.createMonitor(config.assetsSrc, {}, function(monitor) {
    setMonitorCallback(monitor, function() {
      const task = `copying ${config.assetsSrc} directory to ${config.assetsDist}`;
      logger.notifyStartTask(task);
      fs.copySync(config.assetsSrc, config.assetsDist);
      logger.notifyDone();
    });
  });

  // watch src/browser/sass
  watch.createMonitor(config.sassSrc, {
    filter: filterExtensions([ 'scss' ])
  }, function(monitor) {
    setMonitorCallback(monitor, transpiler.renderCss);
  });

  // watch src/browser/js
  watch.createMonitor(config.clientSrc, {
    filter: filterExtensions([ 'js', 'vue' ])
  }, function(monitor) {
    setMonitorCallback(monitor, transpiler.renderBrowserCode);
  });

  
  // watch src/node
  watch.createMonitor(config.nodeSrc, {
    filter: filterExtensions([ 'js' ])
  }, function(monitor) {
    setMonitorCallback(monitor, function() {
      transpiler.renderNodeCode().then(app.restart);
    });
  });

  // watch src/main.js
  watch.createMonitor('src', {}, function(monitor) {
    setMonitorCallback(monitor, function(file) {
      if (file === config.mainSrcInput || file == config.configSrcInput) {
        transpiler.renderNodeCode().then(app.restart);
      }
    });
  });
}

function start() {
  console.log('starting');
  app.start();
}

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

  fs.removeSync(config.nodeModulesOutput);
  fs.copySync(config.nodeModulesInput, config.nodeModulesOutput);
  packager({
    dir: config.dist,
    name: config.app.name,
    out: config.build,
    overwrite: true,
    icon: path.join(config.assetsSrc, iconFilename),
    asar: true,
  })
  .then((appPaths) => {
    // console.log(appPaths);
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
      spawn('electron-rebuild', [ '-o', 'serialport,xmm-node' ], {
        stdio: [ process.stdin, process.stdout, process.stderr ],
      });
      break;
  }
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
        setupIcon: path.join(config.assetsSrc, 'movuino.ico'),
        loadingGif: path.join(config.assetsSrc, 'movuino.gif'),
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


