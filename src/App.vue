<template>
  <div id="app">
    <div id="music-section">
      <h1>Music listener</h1>
      <MusicSection/>
    </div>
    <LikeOrNot/>
    <CommentsSection/>
  </div>
</template>

<script>
import MusicSection from './components/MusicSection.vue';
import LikeOrNot from './components/LikeOrNotSection.vue';
import CommentsSection from './components/CommentsSection.vue';

export default {
  name: 'App',
  components: {
    MusicSection,
    LikeOrNot,
    CommentsSection
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Aboreto&display=swap');
#app {
    text-align: center;
    margin-top: 60px;
    #music-section{
      height: 600px;
    }
}
h1{
    font-family: 'Aboreto', cursive;
    color: #7e6114;
}
</style>
