<script>
  const lightYellow = '#fff17a';
  const lightBlue = '#7cdde2';
  const lightRed = '#f45a54';

  export default {
    inject: [ 'provider' ],
    props: {
      step: false, // just to force render even if no other value changes
      name: { type: String, default: '' },
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
      zoom: { type: Number, default: 0 }, // max unzoom, max zoom : 1
      lstyle: { type: String, default: 'curve' },
      pstyle: { type: String, default: 'none' },
      lwidth: { type: Number, default: 1 }, // thin line, thickest : 1
    },
    computed: {
      resolution: function() {
        return parseInt((1 - this.zoom) * (this.maxRes - this.minRes) + this.minRes);
      },
    },
    data() {
      return {
        coords: [ 'x', 'y', 'z' ],
        colors: [ lightYellow, lightBlue, lightRed ],
      }
    },
    created() {
      // see https://github.com/vuejs/vue/issues/1988
      // we instantiate these variables here so that they are not reactive
      this.minRes = 7; // this seems to be because we obtain "step" with : "width / (this.resolution - 5)";
      this.maxRes = 128;
      this.dimension = 3;
      this.minInput = -1;
      this.maxInput = 1;
      this.buffer = [];
      this.lastRenderParams = '';
      this.mcanvas = document.createElement('canvas');
      this.mctx = this.mcanvas.getContext('2d');
      this.bcanvas = document.createElement('canvas');
      this.bctx = this.bcanvas.getContext('2d');

      this.lastDate = Date.now();
      this.minDisplayInterval = 30;

      this.initBuffer();
    },
    mounted() {},
    methods: {
      initBuffer() {
        for (let i = 0; i < this.maxRes; i++) {
          this.buffer.push([]);

          for (let j = 0; j < this.dimension; j++) {
            this.buffer[i].push(0.5);
          }
        }        
      },
      pushToBuffer(values) {
        this.buffer.splice(0, 1);

        const sensorValues = values.slice();

        for (let k = 0; k < this.dimension; k++) {
          sensorValues[k] = Math.min(Math.max(sensorValues[k], this.minInput), this.maxInput);
          sensorValues[k] -= this.minInput;
          sensorValues[k] /= (this.maxInput - this.minInput);
          sensorValues[k] = 1 - sensorValues[k];
        }

        this.buffer.push(sensorValues);
      },
    },
    render() {
      // see https://github.com/vuejs/Discussion/issues/356
      this.step = this.step; // must use this (dumb) var to force rendering if no other prop value changes

      this.pushToBuffer([ this.x, this.y, this.z ]);

      // rendering is optimized when only data input (this.x, this.y and / or this.z) changes
      // (if some display parameters change, they retrigger the whole canvas rendering)
      // on each new frame, if the optimization is possible, we :
      // - copy the last rendered main offline context (this.mctx) to the buffer offline context (this.bctx)
      // - draw only the last 4 points of the curves on the rightmost part of the main context
      // - paste the buffer context into the main context with an offset to the left of 1 point spacing
      // - draw the main context into the actual canvas' context (ctx)
      // - repeat :)
      // - tadaaaaaa (voilà) !

      // check if any rendering parameter changed (if so we must redraw the whole canvas)
      let renderParamsChanged = false;

      const newRenderParams = `${this.zoom}-${this.lstyle}-${this.pstyle}-${this.lwidth}`;
      if (newRenderParams !== this.lastRenderParams) { renderParamsChanged = true; }
      this.lastRenderParams = newRenderParams;
      renderParamsChanged = renderParamsChanged;// || (this.resolution < 8);
      // now we know if we must redraw everything


      // Since the parent canvas has to mount first, it's *possible* that the context may not be
      // injected by the time this render function runs the first time.
      if(!this.provider.context) return;
      const ctx = this.provider.context;

      // check if client size changed
      const scale = window.devicePixelRatio || 1;

      let clientSizeChanged = false;

      if (ctx.canvas.width !== ctx.canvas.clientWidth * scale ||
          ctx.canvas.height !== ctx.canvas.clientHeight * scale) {
        ctx.canvas.width = ctx.canvas.clientWidth * scale;
        ctx.canvas.height = ctx.canvas.clientHeight * scale;
        clientSizeChanged = true;
      }

      let width = ctx.canvas.clientWidth;
      let height = ctx.canvas.clientHeight;

      let step = width / (this.resolution - 5);
      // console.log(this.resolution);
      let stepratio = step / parseInt(step);

      if (step < 1) {
        stepratio = step;
        step = 1;
      } else {
        step = parseInt(step);
      }

      // this forces the width to be an integer multiple of step (and removes aliasing) :
      width = step * (this.resolution - 5);

      let mwidth = width + 2 * step; //bipadding;
      let bwidth = width + 2 * step; //padding;

      const bpf = this.buffer;
      const offset = this.maxRes - this.resolution;

      let redraw = false;

      if (clientSizeChanged || renderParamsChanged) {
        redraw = true;
        this.mctx.canvas.width = mwidth * scale;
        this.bctx.canvas.width = bwidth * scale;
        this.mctx.canvas.height = this.bctx.canvas.height = height * scale;
      }

      // with the step + stepratio trick, wratio is always 1
      const wratio = this.mctx.canvas.width / (mwidth * scale);

      // mwidth = this.mctx.canvas.width / scale;
      // bwidth = this.bctx.canvas.width / scale;
      // height = this.mctx.canvas.height / scale;
      // step = mwidth / (this.resolution - 3);

      const swidth = width * scale;
      const smwidth = mwidth * scale;
      const sbwidth = bwidth * scale;
      const sheight = height * scale;
      const sstep = step * scale;

      // redraw = true; // optimization actually doesn't work perfectly so we redraw all the time :(

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.mctx.setTransform(1, 0, 0, 1, 0, 0);
      this.bctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.scale(scale, scale);
      this.mctx.scale(scale, scale);
      this.bctx.scale(scale, scale);

      // space in pixels between two points of the curve
      // const step = mwidth / (this.resolution - 1);

      let startDrawIndex = 0;

      if (!redraw) {
        this.bctx.clearRect(0, 0, bwidth, height);
        this.bctx.fillStyle = '#fff';
        this.bctx.fillRect(0, 0, bwidth, height);

        this.bctx.drawImage(this.mctx.canvas, 0, 0, sbwidth, sheight, 0, 0, bwidth * wratio, height);

        this.bctx.globalAlpha = 1;
        this.mctx.globalAlpha = 1;

        startDrawIndex = this.resolution - 8; 
      }

      this.mctx.fillStyle = '#fff';
      this.mctx.fillRect(0, 0, mwidth, height);

      for (let k = 0; k < this.dimension; k++) {
        this.mctx.strokeStyle = this.colors[k];
        this.mctx.lineWidth = this.lwidth / (1 * stepratio);
        this.mctx.beginPath();

        if (this.lstyle === 'curve') {
          this.mctx.moveTo(step * startDrawIndex, bpf[startDrawIndex + offset][k] * height);

          let i;
          for (i = startDrawIndex; i < this.resolution - 2; i++) {
            const xc = (2 * i + 1) * 0.5 * step;
            const yc = (bpf[i + offset][k] + bpf[i + offset + 1][k]) * height * 0.5; // linear interpolation
            this.mctx.quadraticCurveTo(i * step,
                                       bpf[i + offset][k] * height,
                                       xc,
                                       yc);
          }

          // curve through the last two points
          this.mctx.quadraticCurveTo(i * step,
                                     bpf[i + offset][k] * height,
                                     (i + 1) * step,
                                     bpf[i + offset + 1][k] * height);
        } else { // lstyle === 'lines'
          this.mctx.moveTo(step * startDrawIndex, bpf[startDrawIndex + offset][k] * height);

          for (let i = startDrawIndex + 1; i < this.resolution; i++) {
            this.mctx.lineTo(i * step, bpf[i + offset][k] * height);
          }
        }

        this.mctx.stroke();
        this.mctx.closePath();
      }

      var radius = 1.2 * this.lwidth;

      if (this.pstyle === 'points') {
        for (let k = 0; k < this.dimension; k++) {
          this.mctx.fillStyle = this.colors[k];

          for (let i = startDrawIndex + 1; i < this.resolution - 1; i++) {
            this.mctx.beginPath();
            // this.mctx.arc(i * step, bpf[i + offset][k] * height, radius, 0, 2 * Math.PI, false);
            this.mctx.ellipse(i * step, bpf[i + offset][k] * height, radius / stepratio, radius, 0, 2 * Math.PI, false);
            this.mctx.fill();
            this.mctx.closePath();
          }
        }
      }

      if (!redraw) {
        // console.log('optimizing');

        // this.bctx.fillStyle = 'rgba(255, 0, 0, 0.01)';
        // this.bctx.fillRect(0, 0, bwidth, height);

        // this.mctx.fillStyle = '#fff';
        // this.mctx.fillRect(0, 0, width, height);

        this.mctx.save();
        this.mctx.translate(-step, 0);
        this.mctx.drawImage(this.bctx.canvas, 0, 0, sbwidth, sheight, 0, 0, bwidth, height);
        this.mctx.restore();
      }

      const now = Date.now();
      // if (now - this.lastDate < this.minDisplayInterval) return;
      this.lastDate = now;

      // ctx.fillStyle = '#fff';
      // ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(0, 0);
      ctx.drawImage(this.mctx.canvas, 0, 0, swidth, sheight, 0, 0, width * stepratio, height)
      ctx.restore();
    },
  };
</script>