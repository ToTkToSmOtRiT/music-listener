import { stat } from 'node:fs/promises'

const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

// True only for a browser on the same computer as the server. Choosing which folder on the server
// gets read is a "my own computer" feature, so it is off for public deployments.
export function isLocalRequest(event) {
    // Reached through another host name (a real domain, a tunnel): not local.
    const host = String(getRequestHeader(event, 'host') ?? '').replace(/:\d+$/, '').toLowerCase()
    if (!LOCAL_HOSTS.has(host)) return false

    const forwarded = getRequestHeader(event, 'x-forwarded-for')
    if (import.meta.dev) {
        // Nuxt's dev server proxies requests to the app and reports the real client in X-Forwarded-For.
        const ip = String(forwarded ?? '').split(',')[0].trim() || (getRequestIP(event) ?? '')
        return LOCAL_IPS.has(ip)
    }
    // Production: a forwarding header means a reverse proxy is in front, i.e. the request came from outside.
    if (forwarded || getRequestHeader(event, 'forwarded')) return false
    return LOCAL_IPS.has(getRequestIP(event) ?? '')
}

export function requireLocal(event) {
    if (!isLocalRequest(event)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'The music folder can only be changed on the computer that runs the app'
        })
    }
}

// What the "Local" tab shows. The folder path itself is only revealed to a local browser.
export async function libraryPayload(event) {
    const canEdit = isLocalRequest(event)
    const s = libraryStatus()

    let exists = null
    if (s.dir) exists = await stat(s.dir).then((i) => i.isDirectory()).catch(() => false)

    const { tracks } = useDb()
        .prepare('SELECT COUNT(*) AS tracks FROM tracks WHERE lib_root IS NOT NULL AND available = 1').get()

    return {
        canEdit,
        configured: Boolean(s.dir),
        source: s.source, // 'saved' (set in the app), 'env' (MUSIC_DIR in .env) or 'none'
        dir: canEdit ? s.dir : null,
        exists: canEdit ? exists : null,
        error: canEdit ? s.error : '',
        tracks,
        indexing: s.indexing,
        scanning: scanStatus()
    }
}
