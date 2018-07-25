import Canvas2DRenderer from './Canvas2DRenderer';

class GestureRecorderRenderer extends Canvas2DRenderer {
  constructor(canvas, color = '#f00', offset = 30) {
    super(canvas);
    this.color = color;
    this.value = 0;
    this.focus = false;
    this.offset = offset; // in pixels
  }

  setData([ value, focus ]) {
    this.value = value;
    this.focus = focus;
  }

  _render() {
    // if (!this.data) return;
    // console.log(data);

    const ctx = this.$ctx;
    const c = this.$canvas;

    ctx.fillStyle = '#e6e6e6';
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillRect(0, 0, c.width, c.height);

    if (!this.focus) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, c.width, c.height);
    }
  }
};

export default GestureRecorderRenderer;