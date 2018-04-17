import Canvas2DRenderer from './Canvas2DRenderer';

class BargraphRenderer extends Canvas2DRenderer {
  constructor(canvas, colors = [ '#f00', '#0f0', '#00f' ]) {
    super(canvas);
    this.colors = colors;
  }

  // originally drawMultislider
  _render() {
    if (!this.data) return;
    // console.log(data);

    const ctx = this.$ctx;
    const c = this.$canvas;

    ctx.clearRect(0, 0, c.width, c.height);
    const w = c.width / this.data.length;

    for (var i = 0; i < this.data.length; i++) {
      ctx.fillStyle = this.colors[i % this.colors.length];
      var x = i * w;
      var y = this.data[i] * c.height;
      ctx.fillRect(x, y, w, c.height);
    }
  }
};

export default BargraphRenderer;