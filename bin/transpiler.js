const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const sass = require('node-sass');
const browserify = require('browserify');
const babelify = require('babelify');
const vueify = require('vueify');
const babel = require('babel-core');
const klaw = require('klaw');

const logger = require('./logger');
const config = require('./config.js');

const cwd = path.join(process.cwd(), '/');

// RENDER SASS

function renderCss() {
  return new Promise(function(resolve, reject) {
    const task = `rendering ${config.cssOutput} file`;
    logger.notifyStartTask(task);
    logger.startTwirling();

    sass.render({
      file: config.sassInput,
      includePaths: config.sassIncludes,
      outFile: config.cssOutput,
    }, function(err, res) {
      if (err !== null) {
        logger.stopTwirling();
        logger.notifyTaskError(task, err);
      } else {
        fs.ensureFileSync(config.cssOutput);
        fs.writeFileSync(config.cssOutput, res.css);
        logger.stopTwirling();
        logger.notifyDone();
        resolve();   
      }
    });
  });
}

// TRANSPILE A SINGLE FILE USING BABEL

function transpileFile(inputFile) {
  return new Promise(function(resolve, reject) {
    const outputFilepath = inputFile.path.replace(config.src, config.dist);

    if (inputFile.type === 'file') {
      const task = `transpiling file ${inputFile.path} to ${outputFilepath}`;
      logger.notifyStartTask(task);

      babel.transformFile(inputFile.path, {}, function(err, res) {
        if (err !== null) {
          logger.notifyTaskError(task, err);
        } else {
          fs.ensureFileSync(outputFilepath);
          fs.writeFileSync(outputFilepath, res.code);
        }
        resolve();
      });
    } else {
      logger.notifyStartTask(`creating directory ${outputFilepath} ...`);
      resolve();
    }
  });  
}

// LET SOME VUE BABEL PLUGIN DO ITS JOB FOR BROWSER CODE (ACTUALLY DOESN'T WORK)

// function renderBrowserCode() {
//   return new Promise(function(resolve, reject) {
//     const items = [];

//     klaw(config.clientSrc)
//     .on('data', function(item) {
//       if (item.stats.isDirectory()) {
//         item.type = 'dir';
//       } else {
//         item.type = 'file';
//       }

//       item.path = item.path.split(cwd)[1];
//       items.push(item);
//     })
//     .on('end', function() {
//       const task = `transpiling node files`;
//       logger.notifyStartTask(task);
//       logger.startTwirling();
//       const promises = [];

//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type === 'file') {
//           promises.push(transpileFile(items[i]));
//         }
//       }

//       Promise.all(promises)
//       .then(function() {
//         logger.stopTwirling();
//         logger.notifyDone();  
//         resolve();
//       })
//       .catch(function(err) {
//         logger.stopTwirling();
//         logger.notifyTaskError(task, err);
//         resolve();
//       });
//     });
//   });
// }

// BROWSERIFY / BABELIFY / VUEIFY (WORKING ALTERNATIVE)

function renderBrowserCode() {
  return new Promise(function(resolve, reject) {
    const task = `rendering ${config.clientSrcOutput} file`;
    logger.notifyStartTask(task);
    logger.startTwirling();

    fs.ensureFileSync(config.clientSrcOutput);
    browserify(config.clientSrcInput)
      .transform('babelify')
      .transform('vueify')
      .bundle()
      .pipe(fs.createWriteStream(config.clientSrcOutput))
      .on('error', function(err) {
        logger.stopTwirling();
        logger.notifyTaskError(task, err);
      })
      .on('finish', function() {
        logger.stopTwirling();
        logger.notifyDone();
        resolve();
      });
  });
}

// TRANSPILE ALL NODE FILES

function renderNodeCode() {
  return new Promise(function(resolve, reject) {
    const items = [];

    klaw(config.nodeSrc)
    .on('data', function(item) {
      if (item.stats.isDirectory()) {
        item.type = 'dir';
      } else {
        item.type = 'file';
      }

      item.path = item.path.split(cwd)[1];
      items.push(item);
    })
    .on('end', function() {
      const task = `transpiling node files`;
      logger.notifyStartTask(task);
      logger.startTwirling();
      const promises = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'file') {
          promises.push(transpileFile(items[i]));
        }
      }

      promises.push(transpileFile({
        path: config.mainSrcInput,
        type: 'file',
      }));

      promises.push(transpileFile({
        path: config.configSrcInput,
        type: 'file',
      }));

      Promise.all(promises)
      .then(function() {
        logger.stopTwirling();
        logger.notifyDone();  
        resolve();
      })
      .catch(function(err) {
        logger.stopTwirling();
        logger.notifyTaskError(task, err);
        resolve();
      });
    });
  });
}

module.exports = {
  renderCss,
  renderBrowserCode,
  renderNodeCode,
}