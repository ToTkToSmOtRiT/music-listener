// GET /api/playlists/special[?track=ID] -> the two built-in lists, Saved and Liked, that sit on top of
// the user's own playlists. With a track it also says whether that track is in each of them.
export default defineEventHandler((event) => {
    const user = requireUser(event)
    const raw = getQuery(event).track
    const track = raw === undefined ? null : Number(raw)
    const db = useDb()

    const list = (table, key, name) => ({
        key,
        name,
        count: db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(user.id).n,
        has: track !== null && Boolean(db.prepare(`SELECT 1 FROM ${table} WHERE user_id = ? AND track_id = ?`).get(user.id, track))
    })
    return [list('favourites', 'saved', 'Saved'), list('likes', 'liked', 'Liked')]
})
