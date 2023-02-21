<template>
  <header class="p-3 text-bg-dark">
    <HeadBar />
  </header>
    <div id="main">
      <router-view />
    </div>
</template>

<script>
import HeadBar from './views/HeadBar.vue';
export default {
  components: {
    HeadBar
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Aboreto&display=swap');

header {
  // margin-bottom: 60px;
}

#app {
  position:static;
  text-align: center;

}

h1 {
  font-family: 'Aboreto', cursive;
  color: #9b7c27;
}
</style>
