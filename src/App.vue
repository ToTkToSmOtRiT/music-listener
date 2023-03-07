<template>
  <header class="p-3 text-bg-dark">
    <HeadBar />
  </header>
    <div id="main">
      <router-view />
    </div>
    <Footer/>
</template>

<script>
import HeadBar from './components/HeadBar.vue';
import Footer from './views/Footer.vue';

export default {
  components: {
    HeadBar,
    Footer,
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Aboreto&display=swap');

#app {
  position:static;
  text-align: center;

}

h1 {
  font-family: 'Aboreto', cursive;
  color: #9b7c27;
}
</style>
