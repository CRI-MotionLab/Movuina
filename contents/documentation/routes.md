### routes

The main entry point to tweak the structure of the website is the `src/server/routes.js` file.

```
import menus from './menus';

const mainMenu = menus.main;
const userMenu = menus.user;

const routes = {
  home: {
    route: '/',
    template: 'default',
    data: {
      title: 'About',
      styles: [ 'main' ],
      scripts: [ 'main' ],
      format: 'articles',
      articles: [ 'about/presentation' ],
      menu: mainMenu,
      userMenu: userMenu,
    }
  },
  // ...
```
