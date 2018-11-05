<script>
  export default {
    inject: [ 'provider' ],
    props: {
      // step: false, // just to force render even if no other value changes
      // name: { type: String, default: '' },
      value: { type: Number, default: 0 },
      color: { type: String, default: '#aaa' },
      focus: { type: Boolean, default: false },
    },
    data() {
      return {};
    },
    methods: {},
    created() {
      this.offset = 30; // needed because of CSS (canvas is overlaid by left index div)
    },
    render() {
      if(!this.provider.context) return;
      const ctx = this.provider.context;
      const c = ctx.canvas;

      if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
        c.width = c.clientWidth;
        c.height = c.clientHeight;
      }

      ctx.fillStyle = '#e6e6e6'; // 90%
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.offset, 0, this.value * (c.width - this.offset), c.height);

      if (!this.focus) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, c.width, c.height);
      }
    },
  };
</script>