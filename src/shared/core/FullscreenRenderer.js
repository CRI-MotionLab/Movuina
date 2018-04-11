import Script from './Script';

class FullscreenRenderer extends Script {
  constructor() {
    super();

    this._draw = this._draw.bind(this);
  }

  loaded() {
    this.$canvas = document.querySelector('#main-gui');
    this.$ctx = this.$canvas.getContext('2d');

    this._updateCanvasDimensions();

    this.$ctx.fillStyle = '#000';
    this.$ctx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);

    window.addEventListener('scroll', (e) => {
    })

    window.addEventListener('resize', (e) => {
      this._updateCanvasDimensions();
    });

    window.requestAnimationFrame(this._draw);
  }

  _draw() {
    const ctx = this.$ctx;
    const w = this.$canvas.width;
    const h = this.$canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);

    if (Math.random() < 0.25) {
      ctx.beginPath();
      const x = Math.random() * w;
      const y = Math.pow(Math.random(), 2.5) * h
      ctx.arc(x, y, y * 5 / h, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    setTimeout(() => {
      window.requestAnimationFrame(this._draw);
    }, 33);
  }

  _updateCanvasDimensions() {
    const c = this.$canvas;
    const ctx = this.$ctx;

    const w = document.body.clientWidth;
    const h = document.body.clientHeight;

    if (c.width !== w || c.height !== h) {
      const buffer = document.createElement('canvas');

      buffer.width = c.width;
      buffer.height = c.height;
      const bufCtx = buffer.getContext('2d');
      bufCtx.drawImage(c, 0, 0, c.width, c.height);

      c.width = w;
      c.height = h;
      ctx.drawImage(buffer, 0, 0, w, h);
    }
  }
};

export default FullscreenRenderer;
