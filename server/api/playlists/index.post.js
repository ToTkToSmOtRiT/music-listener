// POST /api/playlists { name, trackId? } -> create a playlist, optionally starting with one track
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const body = (await readBody(event)) || {}
    const name = cleanName(body.name)
    const db = useDb()

    const { n } = db.prepare('SELECT COUNT(*) AS n FROM playlists WHERE user_id = ?').get(user.id)
    if (n >= MAX_PLAYLISTS) {
        throw createError({ statusCode: 400, statusMessage: `You can have up to ${MAX_PLAYLISTS} playlists` })
    }
    const trackId = body.trackId === undefined ? null : Number(body.trackId)
    if (trackId !== null && !trackExists(trackId)) {
        throw createError({ statusCode: 404, statusMessage: 'Track not found' })
    }

    const id = Number(db.prepare('INSERT INTO playlists (user_id, name) VALUES (?, ?)').run(user.id, name).lastInsertRowid)
    if (trackId !== null && addToPlaylist(id, trackId)) addSignal(user.id, trackId, SIGNAL.playlist)

    setResponseStatus(event, 201)
    return listPlaylists(user.id, trackId).find((p) => p.id === id)
})
