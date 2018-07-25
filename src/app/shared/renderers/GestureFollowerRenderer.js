import Canvas2DRenderer from './Canvas2DRenderer';

class GestureFollowerRenderer extends Canvas2DRenderer {
  constructor(canvas, colors = [ '#f00', '#0f0', '#00f' ]) {
    super(canvas);
    this.colors = colors;
  }

  _render() {
    // if (!this.data) return;
    // console.log(data);

    const ctx = this.$ctx;
    const c = this.$canvas;

    ctx.fillStyle = '#e6e6e6'; // 90%
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillRect(0, 0, c.width, c.height);
  }
};

export default GestureFollowerRenderer;