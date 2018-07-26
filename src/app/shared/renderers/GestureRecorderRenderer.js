import Canvas2DRenderer from './Canvas2DRenderer';

class GestureRecorderRenderer extends Canvas2DRenderer {
  constructor(canvas, colors = [ '#f00', '#0f0', '#00f' ]) {
    super(canvas);
    this.colors = colors;
    this.lineWidth = 1;

    this.reset();
  }

  reset() {
    this.buffer = [];
  }

  setData(data) {
    if (data.length === 3) {
      const d = [];

      for (let i = 0; i < 3; i++) {
        d.push(data[i] * 0.5 + 0.5);
      }

      this.buffer.push(d);
    }
  }

  _render() {    
    const ctx = this.$ctx;
    const c = this.$canvas;

    const padding = 10;
    const bipadding = 20;

    ctx.fillStyle = '#eee';
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillRect(0, 0, c.width, c.height);

    if (this.buffer.length < 2) return;

    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = this.colors[k];
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();

      ctx.moveTo(0, this.buffer[0][k] * c.height);

      let i;
      for (i = 0; i < this.buffer.length - 2; i++) {
        const xc = (2 * i + 1) * (c.width + bipadding) * 0.5 / (this.buffer.length - 1) - padding;
        const yc = (this.buffer[i][k] + this.buffer[i + 1][k]) * c.height * 0.5;
        ctx.quadraticCurveTo(i * (c.width + bipadding) / (this.buffer.length - 1) - padding, this.buffer[i][k] * c.height, xc, yc);
      }

      // curve through the last two points
      ctx.quadraticCurveTo(i * (c.width + bipadding) / (this.buffer.length - 1) - padding, this.buffer[i][k] * c.height,
                           (i + 1) * (c.width + bipadding) / (this.buffer.length - 1) - padding, this.buffer[i + 1][k] * c.height);

      ctx.stroke();
      ctx.closePath();
    }
  }
};

export default GestureRecorderRenderer;