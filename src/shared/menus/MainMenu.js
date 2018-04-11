import Script from '../core/Script';

class MainMenu extends Script {
  constructor() {
    super();
  }

  loaded() {
    this.$navbar = document.querySelector('.navbar');
    this.navbarHeight = this.$navbar.clientHeight;
    this.$navbarMenu = document.querySelector('.navbar-mainmenu');
    this.$navbarOverlay = document.querySelector('.navbar-overlay');
    this.$navicon = document.querySelector('#navicon');

    // make sure the menu is not expanded when going back into history
    this.$navbarMenu.addEventListener('click', (e) => {
      if (this.$navbar.classList.contains('active')) {
        this.$navbar.classList.remove('active');
        this.$navbarOverlay.classList.remove('active');
      }
    });

    this.$navicon.addEventListener('click', (e) => {
      this.$navbar.classList.toggle('active');
    }, true);

    window.addEventListener('click', (e) => {
      if (this.$navbar.classList.contains('active') &&
          !e.target.matches('#navicon')) {
        this.$navbar.classList.remove('active');
      }
    });
  }
};

export default MainMenu;
