// PUT /api/foryou/settings { enabled } -> turn "For you" on or off. While off, nothing is learned
// and the Listen tab is a plain random feed. Turning it off keeps what was learned; reset deletes it.
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const { enabled } = (await readBody(event)) || {}
    if (typeof enabled !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'enabled must be true or false' })
    }
    setForyouEnabled(user.id, enabled)
    return tasteProfile(user.id)
})
