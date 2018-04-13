### npm scripts

* `npm run watch` will transpile all es6 source code and browserify transpiled client code,
  render styles, start the server, then run a watcher that will:
    * transpile es6 source code on each modification in the `src/server` directory
      then restart the server,
    * transpile es6 source code on each modification in the `src/client` directory
      then browserify relevant `index.js` files,
    * generate new `css` files on each modification in the `styles` directory.
* `npm run start` will transpile all es6 source code and browserify transpiled client code,
  render styles, then start the server.
* `npm run render` will transpile all es6 source code and browserify transpiled client code,
  render styles, then render all routes as static html files.
