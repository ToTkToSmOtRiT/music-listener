export default defineEventHandler((event) => {
    const user = getSessionUser(event)
    return { user: user ? publicUser(user) : null }
})
