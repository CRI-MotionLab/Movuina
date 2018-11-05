<script>
  const lightYellow = '#fff17a';
  const lightBlue = '#7cdde2';
  const lightRed = '#f45a54';

  export default {
    inject: [ 'provider' ],
    props: {
      name: { type: String, default: '' },
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    data() {
      return {
        coords: [ 'x', 'y', 'z' ],
        colors: [ lightYellow, lightBlue, lightRed ],
      }
    },
    render() {
      // Since the parent canvas has to mount first, it's *possible* that the context may not be
      // injected by the time this render function runs the first time.
      if(!this.provider.context) return;
      const ctx = this.provider.context;

      // check if client size changed
      if (ctx.canvas.width !== ctx.canvas.clientWidth ||
          ctx.canvas.height !== ctx.canvas.clientHeight) {
        ctx.canvas.width = ctx.canvas.clientWidth;
        ctx.canvas.height = ctx.canvas.clientHeight;
      }

      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      ctx.clearRect(0, 0, width, height);
      const w = width / 3;

      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = this.colors[i];
        var x = i * w;

        var normy = this[this.coords[i]] * 0.5 + 0.5;
        var y = (1 - normy) * height;
        var h = normy * height;

        ctx.fillRect(x, y, w, h);
      }
    },
  };
</script>