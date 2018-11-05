# Movuina

## electron based OSC middleware for movuino sensors

#### getting started

* clone this repository.
* `cd` into it.
* type `npm install` to install dependencies.

Then use the following `npm` scripts:

* `npm run watch` will build the application into the `dist` directory, start it, and watch modifications in the `assets` and `src` directories to rebuild and restart automatically.
* `npm run build` will build the application into the `dist` directory, and package it into the `build` directory using `electron-packager`.
* on windows, `npm run createWindowsInstaller` can be called after `npm run build`, this will generate an installer for windows.
* `npm run version` will print a list of the versions of all `electron`'s dependencies (`node`, etc).

&#x26A0; At the moment this project doesn't use `electron-rebuild` systematically, so you should use utilities like `n` or `nvm` to use the same version of node.js as the one reported by `npm run version`

#### structure of this repository

* `assets` contains all the assets used by the application and will be copied to `dist/browser`.
* `bin` contains the build system, i.e. all the scripts used to transpile, render, and bundle the source code.
    * `index.js` is the main entry point (see the `scripts` section in `package.json`).
    * `config.js` contains all the information needed by the build system (mostly a collection of paths).
* `src` is where all the source code is located:
    * `main.js` is the main application entry point.
    * `config.js` is where all application-specific constants are defined.
    * `node` contains all the es6 source code executed in the main process:
        * `ViewController.js` is a singleton class which deals with the renderer process lifecycle and is also used as its communication interface.
        * `Devices.js` is an interface with all external communication (serial and network), and communicates with the renderer process via the ViewController interface.
        * `Modules.js` provides services to all the signal processing modules from the renderer process, executing some tasks for them which can't be done with client code only. Communication also happens via the ViewController interface.
    * `browser` contains all the es6 / vue source code executed in the renderer process.
        * `index.html` is the page loaded by the ViewController interface, starting the renderer process by including the `js/index.js` file
        * `js` contains all the es6 / vue source code to be transpiled and bundled:
            * `index.js` is the entry point.
            * `store.js` is the vuex store and also serves as the communication interface with the renderer process (via ViewController).
            * `components` contains all the `.vue` single-file-component files.
            * `lfos` is a set of extensions to `waves-lfo`, a modular signal processing library used by the application.
        * `sass` contains all the styles written in `sass` format.
* `dist` is where:
    * the fonts and media are copied from `assets`
    * the transformed code from `src`'s subdirectories is generated (see `bin/config.js`).
    * the `package.json` file is copied.
    * the `node_modules` directory is copied to allow `electron-packager` to do its job.
* `build` is where the actual applications are built using `electron-packager`, bundling the `dist` directory into a distributable software.

#### dependencies

This project uses:

* **`watch`** to watch for modifications in the `src` and `assets` directories and notify them.
* **`babel`** to transpile all the es6 code from `src` into `dist` (except the `src/browser` directory).
* **`browserify`**, **`babelify`** and **`vueify`** to transpile and bundle the es6 / vue code from `src/browser/js` into `dist/browser/js/index.js`.
* **`vue`** to improve modularity of the renderer process source code.
* **`node-sass`** to render the `scss` files from `src/browser/sass` to `css` files in `dist/browser/css`.
* **`electron`** to run the application while developing.
* **`electron-packager`** to bundle the application into a distributable software.
