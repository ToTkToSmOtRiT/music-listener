<template>
  <div>
    <header class="p-3 text-bg-dark">
      <HeadBar />
    </header>
    <div id="main">
      <NuxtPage />
    </div>
    <AppFooter />
  </div>
</template>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Aboreto&display=swap');

#__nuxt {
  position: static;
  text-align: center;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}

img {
  max-width: 100%;
}

h1 {
  font-family: 'Aboreto', cursive;
  color: #9b7c27;
}
</style>
