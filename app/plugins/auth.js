export default defineNuxtPlugin(async () => {
  const user = useUser()
  try {
    const { user: current } = await useApi().auth.me(useRequestHeaders(['cookie']))
    user.value = current
  } catch (error) {
    user.value = null
  }
  // The old placeholder login kept the user in localStorage; that is no longer used.
  if (import.meta.client) {
    try { localStorage.removeItem('user') } catch (error) { /* storage unavailable */ }
  }
})