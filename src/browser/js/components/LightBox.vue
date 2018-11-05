<template>
  <div id="lightbox" :class="show ? 'on' : ''">

    <div v-if="view === 'drivers'" id="lightbox-contents">
      <p>
        It seems that you don't have the proper serial drivers installed.<br>
        Would you like to <a id="download-drivers-link" href="#"> download them </a> ?
      </p>
      <button id="ok-btn"> CLOSE </button>
    </div>

    <div v-else-if="view === 'recording'" id="lightbox-contents">
      <p>
        Save recording as ...
        <div><ul>
          <li>
            <input
              type="checkbox" id="select-all-formats"
              v-model="data.recording.all"
              v-on:change="() => {
                if (data.recording.all) {
                  data.recording.csv = data.recording.xlsx = true;
                }
              }"
            >
            All formats
          </li>
          <li> <br> </li>
          <li> <input type="checkbox" id="csv" v-model="data.recording.csv"> CSV (.csv) </li>
          <li> <input type="checkbox" id="excel" v-model="data.recording.xlsx"> Excel (.xlsx) </li>
        </ul></div>
      </p>
      <button v-on:click="onClick" id="ok-btn"> OK </button>
    </div>

  </div>
</template>

<script>
  export default {
    props: [ 'view', 'show' ],
    data() {
      return {
        data: {
          drivers: { /* no need for vars */ },
          recording: {
            all: false,
            csv: false,
            xlsx: false,
          },
        }
      };
    },
    methods: {
      onClick() {
        this.$emit('lightbox-data', this.data[this.view]);
      },
    },
  };
</script>