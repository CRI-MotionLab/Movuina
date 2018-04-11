const fs = require('fs-extra');
const path = require('path');

// const validExtensions = [ 'js', 'json', 'scss' ];

//================= log objects with circular dependencies : =================//

const inspectutil = require('util').inspect;

function inspect(obj) {
  return inspectutil(obj, false, null);
}

//======================== filter files by extension : =======================//

// const validateExtensions = new RegExp(`^(.+\\.(${validExtensions.join('|')})|[^\\.]*)$`);

function filterExtensions(extensions) {
  return function(file) {
    // const ext = extensions;
    const regex = new RegExp(`^(.+\\.(${extensions.join('|')})|[^\\.]*)$`);
    return regex.test(file);
  }
};

//======= recursive folder hierarchy walker, stolen and adapted from : =======//
// https://stackoverflow.com/questions/11194287/convert-a-directory-structure-in-the-filesystem-to-json-with-node-js

function createDirTree(filename, options = {}, level = 0, parent = null) {
  const stats = fs.lstatSync(filename);
  const info = {
    path: filename,
    name: level === 0 ? filename : path.basename(filename),
    level: level,
    parent: parent,
  };

  if (stats.isDirectory()) {
    info.type = "folder";

    const children = fs.readdirSync(filename);
    info.children = [];

    for (let i = 0; i < children.length; i++) {
      if (options && options.filter && !options.filter(children[i])) {
        // do nothing
      } else {
        info.children.push(
          createDirTree(path.join(filename, children[i]), options, level + 1, info)
        );
      }
    }

    info.containsIndexFile = false;

    for (let i = 0; i < info.children.length; i++) {
      if (info.children[i].name === 'index.js') {
        info.containsIndexFile = true;
        break;
      }
    }
  } else {
    // Assuming it's a file. In real life it could be a symlink or
    // something else!
    info.type = "file";
  }

  return info;
}

// returns the node with the path "filename" in the "files" object
// this object should have been created by the createDirTree function

function getFileFromFilename(filename, files) {
  if (files.path === filename) {
    return files;
  }

  const children = files.children || [];

  for (let i = 0; i < children.length; i++) {
    const res = getFileFromFilename(filename, children[i]);

    if (res !== null) {
      return res;
    }
  }

  return null;
}


module.exports = {
  inspect,
  filterExtensions,
  createDirTree,
  getFileFromFilename,
};