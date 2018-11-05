<script>
  export default {
    inject: [ 'provider' ],
    props: {
      // step: false, // just to force render even if no other value changes
      name: { type: String, default: '' },
      value: { type: Number, default: 0 },
      threshold: { type: Number, default: 0 },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      color: { type: String, default: '#aaa' },
    },
    render() {
      // this.step = this.step;
      // console.log(this.value);
      const energy = this.value / 150;
      const threshold = this.threshold / 150;
      const range = this.max - this.min;

      if(!this.provider.context) return;
      const ctx = this.provider.context;
      const c = ctx.canvas;

      if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
        c.width = c.clientWidth;
        c.height = c.clientHeight;
      }

      const lineWidth = 5;
      const maxY = c.height - lineWidth;

      ctx.clearRect(0, 0, c.width, c.height);

      let h = energy * c.height;
      // let h = (energy - this.min) * c.height / range;
      let y = c.height - h;

      ctx.fillStyle = this.color;
      ctx.fillRect(0, y, c.width, h);

      y = (1 - threshold) * c.height + lineWidth * 0.5;
      // y = (1 - (threshold - this.min) / range) * c.height;
      y -= lineWidth * 0.5;
      y = y > maxY ? maxY : y;
      h = lineWidth;

      ctx.fillStyle = '#666'; //this.colors[1];
      ctx.fillRect(0, y, c.width, h);
    },
  };

</script>
