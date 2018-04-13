### config

A couple of configuration parameters must be defined in order for the npm scripts to do their job.
These parameters are stored in files located in `src/server/config/`.
The default config file is `default.js`, but if you look at the scripts section
in `package.json`, you will see that you can specify an alternative config file
by passing its filename without extension as the 4th argument to `build/index.js`:

```
"scripts": {
  "watch": "node build/index.js watch",
  "start": "node build/index.js start",
  "render": "node build/index.js render github",
  "test": "echo \"Error: no test specified\" && exit 1"
},
// ...
```

Here, the `github.js` file is use instead of the default config when running
`npm run render`:

```
const config = {
  title: '',
  port: 3000,
  serverRoot: '/express-playground',
  publicDir: 'docs',
};

export default config;
```
