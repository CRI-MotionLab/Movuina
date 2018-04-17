import Script from '../core/Script';

class UserMenu extends Script {
  constructor() {
    super();
  }

  loaded() {
    this.$userContainer = document.querySelector('.user-container');
    this.$usericon = document.querySelector('#usericon');

    if (!this.$userContainer || !this.$usericon) {
      return;
    }

    this.$usericon.addEventListener('click', (e) => {
      this.$userContainer.classList.toggle('show');
    }, true);

    window.addEventListener('click', (e) => {
      if (this.$userContainer.classList.contains('show') &&
          !e.target.matches('#usericon')) {
        this.$userContainer.classList.remove('show');
      }
    });
  }
};

export default UserMenu;
