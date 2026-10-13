import AOS from 'aos'

export default defineNuxtPlugin((nuxtApp) => {
  AOS.init()
  nuxtApp.hook('page:finish', () => AOS.refresh())
})
