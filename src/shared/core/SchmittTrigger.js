class SchmittTrigger {
  constructor(lo, hi, callback) {
    this.lo = lo;
    this.hi = hi;
    this.state = false;
    this.callback = callback;
  }

  scroll(v) {
    if (this.state === false && v > this.hi) {
      this.state = true;
      this.callback(this.state);
    } else if (this.state === true && v < this.lo) {
      this.state = false;
      this.callback(this.state);
    }
  }
};

export default SchmittTrigger;
