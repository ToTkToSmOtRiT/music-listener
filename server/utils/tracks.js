// Real tags (artist, title, cover) are read lazily, the first time a track is shown.
async function refineTags(rows) {
    const db = useDb()
    const update = db.prepare('UPDATE tracks SET artist = ?, title = ?, has_cover = ?, meta_done = 1 WHERE id = ?')
    await Promise.all(rows.filter((r) => !r.meta_done).map(async (row) => {
        const file = resolveTrackFile(row.src)
        let tags = null
        try {
            tags = file && (await readTags(file))
        } catch (error) {
            // unreadable tags: keep the filename-based names
        }
        row.artist = tags?.artist || row.artist
        row.title = tags?.title || row.title
        row.has_cover = tags?.hasCover ? 1 : 0
        update.run(row.artist, row.title, row.has_cover, row.id)
    }))
}

// Returns public track objects for the given ids, in the same order.
export async function loadTracks(ids, userId = null) {
    const db = useDb()
    const get = db.prepare('SELECT id, artist, title, src, has_cover, meta_done FROM tracks WHERE id = ?')
    const rows = ids.map((id) => get.get(id)).filter(Boolean)
    await refineTags(rows)

    const likes = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE track_id = ?')
    const comments = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE track_id = ?')
    const liked = db.prepare('SELECT 1 FROM likes WHERE track_id = ? AND user_id = ?')
    const favourited = db.prepare('SELECT 1 FROM favourites WHERE track_id = ? AND user_id = ?')

    return rows.map((r) => ({
        id: r.id,
        artist: r.artist,
        title: r.title,
        hasCover: Boolean(r.has_cover),
        likes: likes.get(r.id).n,
        comments: comments.get(r.id).n,
        liked: userId ? Boolean(liked.get(r.id, userId)) : false,
        favourited: userId ? Boolean(favourited.get(r.id, userId)) : false
    }))
}

export function requireTrack(event) {
    const id = Number(getRouterParam(event, 'id'))
    const track = Number.isInteger(id) && useDb().prepare('SELECT id, src, has_cover FROM tracks WHERE id = ?').get(id)
    if (!track) throw createError({ statusCode: 404, statusMessage: 'Track not found' })
    return track
}

const FLAG_TABLES = { likes: 'likes', favourites: 'favourites' }

export function setFlag(event, table, on) {
    const user = requireUser(event)
    const track = requireTrack(event)
    const t = FLAG_TABLES[table]
    const db = useDb()
    if (on) db.prepare(`INSERT OR IGNORE INTO ${t} (user_id, track_id) VALUES (?, ?)`).run(user.id, track.id)
    else db.prepare(`DELETE FROM ${t} WHERE user_id = ? AND track_id = ?`).run(user.id, track.id)
    return { on, count: db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE track_id = ?`).get(track.id).n }
}

// Deterministic shuffle so a listener's feed has a stable order without repeats.
export function shuffled(items, seed) {
    const out = [...items]
    let s = seed >>> 0 || 1
    const rand = () => {
        s = (s + 0x6d2b79f5) >>> 0
        let t = s
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

// A "source" is an ordered list the player can play through instead of the shuffled feed:
// 'saved', 'liked' or 'playlist:ID'. Returns the track ids in play order and a display label.
export function listSource(source, user) {
    const db = useDb()
    if (source === 'saved' || source === 'liked') {
        const table = source === 'saved' ? 'favourites' : 'likes'
        const ids = db.prepare(`SELECT track_id FROM ${table} WHERE user_id = ? ORDER BY rowid DESC LIMIT 1000`)
            .all(user.id).map((r) => r.track_id)
        return { ids, label: source === 'saved' ? 'Saved' : 'Liked' }
    }
    const match = /^playlist:(\d+)$/.exec(source)
    if (match) {
        const playlist = db.prepare('SELECT id, name FROM playlists WHERE id = ? AND user_id = ?').get(Number(match[1]), user.id)
        if (playlist) return { ids: playlistTrackIds(playlist.id), label: playlist.name }
    }
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
}