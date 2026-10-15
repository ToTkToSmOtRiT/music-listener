<template>
  <div class="app" :class="{ 'app--player': isPlayer }">
    <AppSidebar />

    <div class="app__content">
      <div class="topbar">
        <button type="button" aria-label="Open menu" aria-controls="sidebar" @click="openDrawer">
          <AppIcon name="menu" />
        </button>
        <NuxtLink to="/">Music Listener</NuxtLink>
      </div>

      <div id="main">
        <NuxtPage />
      </div>
      <AppFooter v-if="!isPlayer" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const theme = useTheme()
const { openDrawer } = useSidebar()

// The listening page is a full-screen feed: no page scroll, no footer.
const isPlayer = computed(() => route.path === '/listener')

useHead({
  htmlAttrs: { 'data-theme': theme },
  meta: [{ name: 'theme-color', content: () => (theme.value === 'ivory' ? '#faf7f2' : '#121212') }]
})
</script>

<style lang="scss">
.app {
  display: flex;
  min-height: 100dvh;
  text-align: center;

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  #main {
    flex: 1;
  }

  &--player {
    height: 100dvh;
    overflow: hidden;

    .app__content {
      min-height: 0;
    }

    #main {
      position: relative;
      min-height: 0;
    }
  }
}
</style>
