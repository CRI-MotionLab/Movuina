class Canvas2DRenderer {
  constructor(canvas) {
    this.$canvas = canvas;
    this.$ctx = canvas.getContext('2d');

    this._timeout = null;
    this._running = false;

    this.render = this.render.bind(this);
    this._render = this._render.bind(this);
  }

  setData(data) {
    this.data = data;
  }

  render() {
    this._render();

    // taken from (see also advanced method) :
    // http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/
    this._timeout = setTimeout(() => {
      window.requestAnimationFrame(this.render);
    }, 40);
  }

  _render(data) {
    // do nothing by default
  }

  updateDimensions() {
    this.$canvas.width = this.$canvas.clientWidth;
    this.$canvas.height = this.$canvas.clientHeight;
  }

  start() {
    this.updateDimensions();

    if (!this._running) {
      window.requestAnimationFrame(this.render);
      this._running = true;
    }
  }

  stop() {
    if (this._running && this._timeout !== null) {
      clearTimeout(this._timeout);
      this._timeout = null;
      this._running = false;
    }
  }
};

export default Canvas2DRenderer;