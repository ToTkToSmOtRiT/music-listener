export const MAX_PLAYLISTS = 50
export const MAX_PLAYLIST_TRACKS = 1000

// Playlists are private: someone else's playlist answers 404, same as a missing one.
export function requirePlaylist(event, user) {
    const id = Number(getRouterParam(event, 'id'))
    const row = Number.isInteger(id)
        && useDb().prepare('SELECT id, name FROM playlists WHERE id = ? AND user_id = ?').get(id, user.id)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Playlist not found' })
    return row
}

export function cleanName(value) {
    const name = String(value ?? '').trim().replace(/\s+/g, ' ')
    if (!name || name.length > 80) {
        throw createError({ statusCode: 400, statusMessage: 'Playlist name must be 1-80 characters' })
    }
    return name
}

export function playlistTrackIds(playlistId) {
    return useDb()
        .prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position')
        .all(playlistId)
        .map((r) => r.track_id)
}

export function trackExists(id) {
    return Number.isInteger(id) && Boolean(useDb().prepare('SELECT 1 FROM tracks WHERE id = ?').get(id))
}

export function addToPlaylist(playlistId, trackId) {
    const db = useDb()
    const has = db.prepare('SELECT 1 FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').get(playlistId, trackId)
    if (has) return false
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM playlist_tracks WHERE playlist_id = ?').get(playlistId)
    if (n >= MAX_PLAYLIST_TRACKS) {
        throw createError({ statusCode: 400, statusMessage: `A playlist can hold up to ${MAX_PLAYLIST_TRACKS} tracks` })
    }
    const { next } = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM playlist_tracks WHERE playlist_id = ?').get(playlistId)
    db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)').run(playlistId, trackId, next)
    return true
}

// One row per playlist; with trackId it also says whether that track is already inside.
export function listPlaylists(userId, trackId = null) {
    return useDb().prepare(`
        SELECT p.id, p.name,
            (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS count,
            (SELECT pt.track_id FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
                WHERE pt.playlist_id = p.id AND t.has_cover = 1 ORDER BY pt.position LIMIT 1) AS coverTrackId,
            EXISTS(SELECT 1 FROM playlist_tracks pt WHERE pt.playlist_id = p.id AND pt.track_id = ?) AS has
        FROM playlists p WHERE p.user_id = ? ORDER BY p.id DESC
    `).all(trackId ?? -1, userId).map((p) => ({ ...p, has: Boolean(p.has) }))
}
