import Canvas2DRenderer from './Canvas2DRenderer';

class SignedBargraphRenderer extends Canvas2DRenderer {
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

      // we assume the data is signed
      if (this.data[i] > 0) {
        var y = (1 - this.data[i]) * c.height * 0.5;
        var h = this.data[i] * c.height * 0.5;
      } else {
        var y = c.height * 0.5;
        var h = -this.data[i] * c.height * 0.5;
      }
      ctx.fillRect(x, y, w, h);

      //var y = this.data[i] * c.height;
      //ctx.fillRect(x, y, w, c.height);
    }
  }
};

export default SignedBargraphRenderer;