// Logging out always leads to the home page. The user is cleared first: the route guard would otherwise
// still see a logged-in user and send "/" straight back to the start page.
export function useLogout() {
  const api = useApi()
  const user = useUser()

  return async function logout() {
    if (!user.value) return
    usePlayer().stop() // the music ends with the session
    clearUser()
    const done = navigateTo('/', { replace: true })
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout request failed', error.message)
    }
    await done
  }
}
