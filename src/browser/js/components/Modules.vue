<template>
<div id="computer">
  <div id="computer-title-container" class="section-container">
    <h1> MY COMPUTER </h1>
  </div>

  <div id="movuino-interaction" class="section-container">
    <h2> Movuino interaction </h2>
    <vibrator />
  </div>

  <div id="data-visualization" class="section-container">
    <h2> Data visualization </h2>
    <preprocessing v-on:lightbox-info="onLightboxInfo"/>
  </div>

  <div id="data-analysis-repetitions" class="section-container">
    <h2> Gesture analysis </h2>
    <repetitions />
  </div>
  
  <div id="data-analysis-gesture-recognition" class="section-container">
    <gesture-recognition />
    </div>
  </div>
</div> <!-- computer -->
</template>

<script>
  import Vibrator from './Modules/Vibrator.vue';
  import Preprocessing from './Modules/Preprocessing.vue';
  import Repetitions from './Modules/Repetitions.vue';
  import GestureRecognition from './Modules/GestureRecognition.vue';

  export default {
    components: {
      vibrator: Vibrator,
      preprocessing: Preprocessing,
      repetitions: Repetitions,
      'gesture-recognition': GestureRecognition,
    },
    methods: {
      onLightboxInfo(info) {
        this.$emit('lightbox-info', info);
      },
    },
  };
</script>
