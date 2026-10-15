export default defineEventHandler(async (event) => {
    rateLimit(event)
    const body = (await readBody(event)) || {}
    const email = normaliseEmail(body.email)
    const password = String(body.password ?? '')
    if (!email || !password) {
        throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
    }

    const user = useDb().prepare('SELECT id, email, username, password_hash FROM users WHERE email = ?').get(email)
    const ok = await verifyPassword(password, user ? user.password_hash : await getDummyHash())
    if (!user || !ok) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
    }

    createSession(event, user.id)
    return publicUser(user)
})
