import path from 'path';

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

const user = {
  loggedIn: {
    myAccount: {
      route: '/account-settings',
      text: 'My account',
    },
    logOut: {
      route: '#',
      text: 'Log out',
    }
  },
  loggedOut: {
    signIn: {
      route: '#',
      text: 'Sign in',
    },
    logIn: {
      route: '#',
      text: 'Log in',
    }
  }
}

const apps = {
  title: 'Demo apps',
  freemix: {
    route: '/apps/freemix',
    text: 'Freemix',
  },
  grrr: {
    route: '/apps/grrr',
    text: 'Grrr',
  },
}

export default {
  main,
  user,
  apps,
};