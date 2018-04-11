# express-playground

### starter project for express based websites

Clone this repository, `cd` into it, then type `npm install` to install dependencies.

Three scripts are available:

* `npm run watch` will transpile all es6 source code and browserify transpiled client code, render styles, start the server, then run a watcher that will:
    * transpile es6 source code on each modification in the `src/server` directory then restart the server
    * transpile es6 source code on each modification in the `src/client` directory then browserify relevant `index.js` files
    * generate new `css` files on each modification in the `styles` directory
* `npm run start` will transpile all es6 source code and browserify transpiled client code, render styles, then start the server.
* `npm run render` will transpile all es6 source code and browserify transpiled client code, render styles, then render all routes as static html files.

### structure

This project uses the `ejs` template engine for rendering html.
The main html template is the `views/default.ejs` file, providing the basic
structure of a responsive website.

The main entry point to modify the architecture of the website is the `src/server/routes.js` file.
Each route specifies its own `ejs` template file, as well as relevant data to populate it.

When using the `default.ejs` template, the relevant data includes html contents,
specified in the `data.articles` field, which will be looked for in the `contents` directory.
It also includes the menu definition, specified in the `data.menu` field.
The menu designed to be used with the `default.ejs` template is defined in the `src/server/menus.js` file,
and is referenced as `main`.

