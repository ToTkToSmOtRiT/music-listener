// Route guard, run on every navigation: for the first page load (on the server, before anything is
// rendered), for links, and for addresses typed into the address bar.
//
// - The home page ("/") is only for visitors who are not logged in; a logged-in user goes to their start page.
// - Visitors who are not logged in can only see the home page. Every other address, even one that does
//   not exist, sends them to "/" with ?next=<where they were going>, so after logging in they continue there.
export default defineNuxtRouteMiddleware((to) => {
  const loggedIn = Boolean(useUser().value)

  if (to.path === '/') {
    if (loggedIn) return navigateTo(HOME_FOR_USERS, { replace: true })
    return
  }

  if (!loggedIn) {
    return navigateTo({ path: '/', query: { next: to.fullPath } }, { replace: true })
  }
})
