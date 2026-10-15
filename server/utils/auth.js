import { randomBytes, createHash, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

const COOKIE = 'sid'
const SESSION_SECONDS = 60 * 60 * 24 * 30

export const MIN_PASSWORD = 8

// --- passwords -------------------------------------------------------------

export async function hashPassword(password) {
    const salt = randomBytes(16)
    const key = await scrypt(password, salt, 64)
    return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password, stored) {
    const [scheme, salt, hash] = String(stored).split('$')
    if (scheme !== 'scrypt' || !salt || !hash) return false
    const expected = Buffer.from(hash, 'base64')
    const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length)
    return timingSafeEqual(key, expected)
}

// Used when the email is unknown so a login attempt costs the same either way.
let dummyHash
export async function getDummyHash() {
    dummyHash ??= await hashPassword('timing-equaliser')
    return dummyHash
}

// --- validation ------------------------------------------------------------

export function normaliseEmail(value) {
    const email = String(value ?? '').trim().toLowerCase()
    return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254 ? email : null
}

export function checkPassword(value) {
    const password = String(value ?? '')
    if (password.length < MIN_PASSWORD) {
        throw createError({ statusCode: 400, statusMessage: `Password must be at least ${MIN_PASSWORD} characters` })
    }
    if (password.length > 200) {
        throw createError({ statusCode: 400, statusMessage: 'Password is too long' })
    }
    return password
}

export function publicUser(user) {
    return { id: Number(user.id), email: user.email, username: user.username }
}

// --- sessions --------------------------------------------------------------

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export function createSession(event, userId) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS
    useDb().prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
        .run(hashToken(token), userId, expiresAt)
    setCookie(event, COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_SECONDS
    })
}

export function getSessionUser(event) {
    const token = getCookie(event, COOKIE)
    if (!token) return null
    return useDb().prepare(`
        SELECT u.id, u.email, u.username
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > unixepoch()
    `).get(hashToken(token)) ?? null
}

export function requireUser(event) {
    const user = getSessionUser(event)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Log in to do that' })
    return user
}

export function destroySession(event) {
    const token = getCookie(event, COOKIE)
    if (token) useDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
    deleteCookie(event, COOKIE, { path: '/' })
}

// --- rate limiting (in-memory, per process) --------------------------------

const hits = new Map()

export function rateLimit(event, { max = 10, windowMs = 15 * 60 * 1000 } = {}) {
    const key = `${getRequestIP(event) ?? 'unknown'}:${event.path}`
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.reset < now) {
        hits.set(key, { count: 1, reset: now + windowMs })
        return
    }
    if (++entry.count > max) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Try again later.' })
    }
}
