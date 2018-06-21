import EventEmitter from 'events';
import ejs from 'ejs';

class Tabs extends EventEmitter {
  constructor() {
    super();
    this.tabs = [];
    this.currentTab = -1;
  }

  init() {
    this.$tabs = document.querySelector('#movuino-tabs');
    this.$tabsList = document.querySelector('#movuino-tabs-list');
    this.addTab();
    this.addTab();
    this.addTab();

    setTimeout(() => {
      this.removeTab(0);
      this.removeTab(0);
      this.removeTab(0);
    }, 5000);
  }

  addTab() {
    this._clearIds();

    const name = 'disconnected';
    const $el = document.createElement('li');

    this.tabs.push($el);
    this.currentTab = this.tabs.length - 1;

    $el.innerHTML = ejs.render(`
      <div><%= name %></div>
      <div class="close-icon"></div>
    `, { name: name });
    $el.id = 'selected';
    const t = this.currentTab;
    $el.addEventListener('click', () => {
      this.setTab(t);
    });

    this.$tabsList.appendChild($el);
  }

  removeTab(index) {
    // does nothing yet
  }

  setTab(index) {
    this._clearIds();
    const i = index < 0 ? 0 : (index > this.tabs.length - 1 ? this.tabs.length - 1 : index);
    this.currentTab = i;
    this.tabs[this.currentTab].id = 'selected';
  }

  _clearIds() {
    this.tabs.forEach(item => {
      item.id = '';
    });
  }
};

export default Tabs;