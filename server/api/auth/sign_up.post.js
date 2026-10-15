const USERNAME = /^[\w.-]{3,30}$/

function uniqueUsername(db, wanted, email) {
    const base = (wanted || email.split('@')[0]).replace(/[^\w.-]/g, '').slice(0, 24).padEnd(3, '_')
    let candidate = base
    while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(candidate)) {
        candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`
    }
    return candidate
}

export default defineEventHandler(async (event) => {
    rateLimit(event)
    const body = (await readBody(event)) || {}
    const email = normaliseEmail(body.email)
    if (!email) throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address' })
    const password = checkPassword(body.password)

    const requested = String(body.username ?? '').trim()
    if (requested && !USERNAME.test(requested)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore'
        })
    }

    const db = useDb()
    if (requested && db.prepare('SELECT 1 FROM users WHERE username = ?').get(requested)) {
        throw createError({ statusCode: 409, statusMessage: 'That username is taken' })
    }
    const username = requested || uniqueUsername(db, '', email)

    let id
    try {
        id = Number(db.prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
            .run(email, username, await hashPassword(password)).lastInsertRowid)
    } catch (error) {
        if (String(error.message).includes('UNIQUE')) {
            throw createError({ statusCode: 409, statusMessage: 'That email is already registered' })
        }
        throw error
    }

    createSession(event, id)
    setResponseStatus(event, 201)
    return publicUser({ id, email, username })
})
