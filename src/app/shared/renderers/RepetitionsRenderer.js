import Canvas2DRenderer from './Canvas2DRenderer';

class RepetitionsRenderer extends Canvas2DRenderer {
  constructor(canvas, colors = [ '#f00', '#555' ]) {
    super(canvas);
    this.colors = colors; // colors[0] == bgcolor, colors[1] == linecolor

    this.energy = 0;
    this.dynamicTrigThreshold = 0;

    this.rendered = false;
    this.updateDimensionsOnRender = false;
  }

  setData(energy, dynamicTrigThreshold) {
    if (!this.rendered) return;
    this.rendered = false;

    this.energy = energy / 120;
    this.dynamicTrigThreshold = dynamicTrigThreshold / 120;
  }

  setUpdateDimensionsOnRender(update) {
    this.updateDimensionsOnRender = update;
  }

  _render() {
    if (this.updateDimensionsOnRender) {
      this.updateDimensions();
    }

    const ctx = this.$ctx;
    const c = this.$canvas;
    const lineWidth = 10;


    ctx.clearRect(0, 0, c.width, c.height);

    let h = this.energy * c.height;
    let y = c.height - h;

    ctx.fillStyle = this.colors[0];
    ctx.fillRect(0, y, c.width, h);

    y = (1 - this.dynamicTrigThreshold) * c.height - lineWidth * 0.5;
    h = lineWidth;

    ctx.fillStyle = this.colors[1];
    ctx.fillRect(0, y, c.width, h);

    this.rendered = true;
  }
};

export default RepetitionsRenderer;
