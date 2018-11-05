<script>
  export default {
    inject: [ 'provider' ],
    props: {
      // step: false, // just to force render even if no other value changes
      // name: { type: String, default: '' },
      reset: { type: Boolean, default: false },
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    data() {
      return {};
    },
    created() {
      this.colors = [ '#fff17a', '#7cdde2', '#f45a54' ]; // light yellow, blue and red
      this.lineWidth = 1;
      this.resetBuffer();
    },
    methods: {
      resetBuffer() {
        this.buffer = [];
      },
      pushToBuffer(data) {
        if (data.length === 3) {
          console.log(data);
          const d = [];

          for (let i = 0; i < 3; i++) {
            d.push(data[i] * 0.5 + 0.5);
          }

          this.buffer.push(d);
        }
      },
    },
    render() {
      // this.step = this.step;
      if (this.reset) {
        this.resetBuffer();
        return;
      }

      this.pushToBuffer([ this.x, this.y, this.z ]);

      if(!this.provider.context) return;
      const ctx = this.provider.context;
      const c = ctx.canvas;

      if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
        c.width = c.clientWidth;
        c.height = c.clientHeight;
      }

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
    },
  };
</script>
