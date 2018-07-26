import Canvas2DRenderer from './Canvas2DRenderer';

class GestureFollowerRenderer extends Canvas2DRenderer {
  constructor(canvas, color = '#f00', offset = 30) {
    super(canvas);
    this.color = color;
    this.offset = offset; // needed because of CSS (canvas is overlaid by left index div)
    this.value = 0;
    this.focus = false;
  }

  setFocus(focus) {
    this.focus = focus;
  }

  setData(value) {
    this.value = value;
  }

  _render() {
    const ctx = this.$ctx;
    const c = this.$canvas;

    ctx.fillStyle = '#e6e6e6'; // 90%
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.offset, 0, this.value * (c.width - this.offset), c.height);

    if (!this.focus) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, c.width, c.height);
    }
  }
};

export default GestureFollowerRenderer;