// GET /api/collection?type=saved|liked -> the logged-in user's saved (favourite) or liked tracks, newest first
const TABLES = { saved: 'favourites', liked: 'likes' }

export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const table = TABLES[getQuery(event).type] ?? TABLES.saved
    const ids = useDb()
        .prepare(`SELECT track_id FROM ${table} WHERE user_id = ? ORDER BY rowid DESC LIMIT 200`)
        .all(user.id)
        .map((row) => row.track_id)
    return { items: await loadTracks(ids, user.id) }
})
