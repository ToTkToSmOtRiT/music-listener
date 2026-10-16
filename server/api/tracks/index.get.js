// GET /api/tracks?limit=10&offset=0&seed=123        -> a page of the shuffled feed
// GET /api/tracks?genre=rock|unsorted&...            -> the same feed, only that genre
// GET /api/tracks?ids=4,9                            -> exactly those tracks, in that order
// GET /api/tracks?source=saved|liked|playlist:5      -> a list in its own order (needs login)
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const user = requireUser(event) // listening needs an account

    if (query.ids) {
        const ids = String(query.ids).split(',').map(Number).filter(Number.isInteger).slice(0, 50)
        return { total: ids.length, items: await loadTracks(ids, user?.id) }
    }

    const offset = Math.max(Number(query.offset) || 0, 0)

    if (query.source) {
        const owner = user
        const { ids, label } = listSource(String(query.source), owner)
        const limit = Math.min(Math.max(Number(query.limit) || 200, 1), 500)
        return { total: ids.length, label, items: await loadTracks(ids.slice(offset, offset + limit), owner.id) }
    }

    await syncLibrary()
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 30)
    const seed = Number(query.seed) || 1
    const db = useDb()

    const genre = query.genre ? String(query.genre) : ''
    let all
    if (genre === 'unsorted') {
        all = db.prepare('SELECT id FROM tracks WHERE available = 1 AND id NOT IN (SELECT track_id FROM track_genres) ORDER BY id')
            .all().map((r) => r.id)
    } else if (genre) {
        if (!GENRE_BY_SLUG[genre]) throw createError({ statusCode: 404, statusMessage: 'Unknown genre' })
        all = db.prepare('SELECT tg.track_id AS id FROM track_genres tg JOIN tracks t ON t.id = tg.track_id WHERE tg.genre = ? AND t.available = 1 ORDER BY tg.track_id')
            .all(genre).map((r) => r.id)
    } else {
        all = db.prepare('SELECT id FROM tracks WHERE available = 1 ORDER BY id').all().map((r) => r.id)
    }

    const page = shuffled(all, seed).slice(offset, offset + limit)
    return { total: all.length, items: await loadTracks(page, user?.id) }
})
