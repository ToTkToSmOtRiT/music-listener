<template>
  <HeadBar/>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
  import HeadBar from './views/HeadBar.vue';
  export default{
    components: {
      HeadBar
    }
  }
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Aboreto&display=swap');
#app {
    text-align: center;
    margin-bottom: 60px;
}
h1{
    font-family: 'Aboreto', cursive;
    color: #7e6114;
}
</style>
