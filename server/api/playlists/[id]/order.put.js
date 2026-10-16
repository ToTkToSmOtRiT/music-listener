// PUT /api/playlists/ID/order { ids: [trackId, ...] } -> set the play order.
// Used for moving and sorting: the list must contain exactly the playlist's tracks.
export default defineEventHandler(async (event) => {
    const playlist = requirePlaylist(event, requireUser(event))
    const ids = ((await readBody(event)) || {}).ids
    const current = playlistTrackIds(playlist.id)

    const valid = Array.isArray(ids)
        && ids.length === current.length
        && new Set(ids).size === ids.length
        && ids.every((id) => current.includes(id))
    if (!valid) {
        throw createError({ statusCode: 400, statusMessage: 'The new order must list every track in the playlist once' })
    }

    const db = useDb()
    const update = db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?')
    db.exec('BEGIN')
    try {
        ids.forEach((id, i) => update.run(i, playlist.id, id))
        db.exec('COMMIT')
    } catch (error) {
        db.exec('ROLLBACK')
        throw error
    }
    return { ids }
})
