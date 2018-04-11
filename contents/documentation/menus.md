### menus

The menu definitions are kept together in the `src/server/menus.js` file.
They are used by the routes to be rendered in the pages, and are structured in the following way:

```
const main = {
  main: {
    route: '/',
    text: 'About',
    picture: null
  },
  editor: {
    route: '/documentation',
    text: 'Doc',
    picture: null
  },
  github: {
    route: 'https://github.com/josephlarralde/express-playground',
    text: 'GitHub',
    picture: null
  }
};
```