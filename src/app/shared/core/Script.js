class Script {
  constructor(options = {}) {
    this.options = options;
    const that = this;
    // window.addEventListener('load', function() {
    document.addEventListener('DOMContentLoaded', function() { // way faster than waiting for window.onload
      setTimeout(function() { that.loaded(); }, 0);
    });
  }

  loaded() {
    // placeholder for children classes
    console.log('window loaded');
  }
};

export default Script;