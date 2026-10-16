// DELETE /api/foryou/profile -> forget everything learned about this user (their plays and taste scores)
export default defineEventHandler((event) => {
    const user = requireUser(event)
    resetTaste(user.id)
    return tasteProfile(user.id)
})
