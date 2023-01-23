<template>
  <div id="app">
    <h1>Music listener</h1>
    <MusicSection/>
  </div>
</template>

<script>
import MusicSection from './components/MusicSection.vue';

export default {
  name: 'App',
  components: {
    MusicSection
  }
}
</script>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #1e699b;
    margin-top: 60px;
}
</style>
