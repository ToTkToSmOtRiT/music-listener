import AOS from 'aos'

export default defineNuxtPlugin((nuxtApp) => {
  // AOS rewrites element classes, so it must start after hydration finishes,
  // otherwise the page no longer matches the server-rendered HTML.
  nuxtApp.hook('app:mounted', () => AOS.init())
  nuxtApp.hook('page:finish', () => AOS.refresh())
})
