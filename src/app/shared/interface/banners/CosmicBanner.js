import Script from '../core/Script';
// import SchmittTrigger from '../core/SchmittTrigger';

class CosmicBanner extends Script {
  constructor() {
    super();

    this._draw = this._draw.bind(this);
  }

  loaded() {
    this.$banner = document.querySelector('.banner');
    this.bannerHeight = this.$banner.clientHeight;

    this.$canvas = document.querySelector('.banner-canvas');
    this.$ctx = this.$canvas.getContext('2d');

    // const ref = this.bannerHeight;
    // this._schmitt = new SchmittTrigger(ref * 0.5, ref * 0.75, (hide) => {
    //   if (!hide && this.$banner.classList.contains('hidden')) {
    //     this.$banner.classList.remove('hidden');
    //   } else if (hide && !this.$banner.classList.contains('hidden')) {
    //     this.$banner.classList.add('hidden');
    //   }
    // });

    this._updateCanvasDimensions();

    this.$ctx.fillStyle = '#000';
    this.$ctx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);

    window.addEventListener('scroll', (e) => {
      this._updateHideBanner();
    })

    window.addEventListener('resize', (e) => {
      this._updateCanvasDimensions();
    });

    window.requestAnimationFrame(this._draw);
  }

  _updateHideBanner() {
      const offset = window.pageYOffset || document.documentElement.scrollTop;
      const hide = offset > 0;

      // eventually use schmitt trigger ...
      // this._schmitt.scroll(offset);

      if (!hide && this.$banner.classList.contains('hidden')) {
        this.$banner.classList.remove('hidden');
      } else if (hide && !this.$banner.classList.contains('hidden')) {
        this.$banner.classList.add('hidden');
      }
  }

  _draw() {
    // update only if canvas is visible
    if (this.$banner.clientHeight > 0) {
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
    }

    setTimeout(() => {
      window.requestAnimationFrame(this._draw);
    }, 33);
  }

  _updateCanvasDimensions() {
    const c = this.$canvas;
    const ctx = this.$ctx;

    const w = c.clientWidth;
    const h = c.clientHeight;

    if (c.width !== w) {
      const buffer = document.createElement('canvas');

      buffer.width = c.width;
      buffer.height = c.height;
      const bufCtx = buffer.getContext('2d');
      bufCtx.drawImage(c, 0, 0, c.width, c.height);

      c.width = w;
      ctx.drawImage(buffer, 0, 0, w, h);
    }

    if (c.height !== h) {
      c.height = h;
    }
  }

};

export default CosmicBanner;
