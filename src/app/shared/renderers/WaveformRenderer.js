import Canvas2DRenderer from './Canvas2DRenderer';

class WaveformRenderer extends Canvas2DRenderer {
  constructor(canvas, colors = [ '#f00', '#0f0', '#00f' ]) {
    super(canvas);
    this.colors = colors;

    this.zoomValue = 0; // max unzoom, max zoom : 1
    this.lineStyle = 'curve';
    this.pointStyle = 'none';
    this.lineWidth = 1; // thin line, thickest : 1

    this.minRes = 4;
    this.maxRes = 128;
    this.resolution = this.maxRes;

    this.dimension = 3;

    this.minInput = -1;
    this.maxInput = 1;

    // TODO :
    // this.filterFreq = 0;

    this.buffer = [];

    for (let i = 0; i < this.maxRes; i++) {
      this.buffer.push([]);

      for (let j = 0; j < this.dimension; j++) {
        this.buffer[i].push(0.5);
      }
    }

    this.rendered = false;
    this.updateDimensionsOnRender = false;
  }

  setData(data) {
    if (!data) return;
    // if (!this.rendered) return;
    if (!this._running) return;

    this.rendered = false;

    this.buffer.splice(0, 1);

    const sensorValues = data.slice();

    for (let k = 0; k < this.dimension; k++) {
      sensorValues[k] = Math.min(Math.max(sensorValues[k], this.minInput), this.maxInput);
      sensorValues[k] -= this.minInput;
      sensorValues[k] /= (this.maxInput - this.minInput);
      sensorValues[k] = 1 - sensorValues[k];
    }

    this.buffer.push(sensorValues);
  }

  get zoom() {
    return this.zoomValue;
  }

  set zoom(z) {
    this.zoomValue = Math.min(Math.max(z, 0), 1);
    this.resolution = parseInt((1 - this.zoomValue) * (this.maxRes - this.minRes) + this.minRes);
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
    const bpf = this.buffer;

    const padding = 10;
    const bipadding = 20;
    const offset = this.maxRes - this.resolution;

    ctx.clearRect(0, 0, c.width, c.height);

    for (let k = 0; k < this.dimension; k++) {
      ctx.strokeStyle = this.colors[k];
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();

      if (this.lineStyle === 'curve') {
        ctx.moveTo(0, bpf[0 + offset][k] * c.height);

        let i;
        for (i = 0; i < this.resolution - 2; i++) {
          const xc = (2 * i + 1) * (c.width + bipadding) * 0.5 / (this.resolution - 1) - padding;
          const yc = (bpf[i + offset][k] + bpf[i + offset + 1][k]) * c.height * 0.5;
          ctx.quadraticCurveTo(i * (c.width + bipadding) / (this.resolution - 1) - padding, bpf[i + offset][k] * c.height, xc, yc);
        }

        // curve through the last two points
        ctx.quadraticCurveTo(i * (c.width + bipadding) / (this.resolution - 1) - padding, bpf[i + offset][k] * c.height,
                             (i + 1) * (c.width + bipadding) / (this.resolution - 1) - padding, bpf[i + offset + 1][k] * c.height);
      } else { // lineStyle === 'lines'
        ctx.moveTo(0, bpf[0 + offset][k] * c.height);

        for (let i = 1; i < this.resolution - 1; i++) {
          ctx.lineTo(i * (c.width + bipadding) / (this.resolution - 1) - padding, bpf[i + offset][k] * c.height);
        }
      }

      ctx.stroke();
      ctx.closePath();
    }

    var radius = 1.2 * this.lineWidth;

    if (this.pointStyle === 'points') {
      for (let k = 0; k < this.dimension; k++) {
        ctx.fillStyle = this.colors[k];

        for (let i = 1; i < this.resolution - 1; i++) {
          ctx.beginPath();
          ctx.arc(i * (c.width + bipadding) / (this.resolution - 1) - padding, bpf[i + offset][k] * c.height, radius, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.closePath();
        }
      }
    }

    this.rendered = true;
  }
};

export default WaveformRenderer;
