// GET /api/tracks?limit=10&offset=0&seed=123   -> a page of the shuffled feed
// GET /api/tracks?ids=4,9                       -> exactly those tracks, in that order
// GET /api/tracks?source=saved|liked|playlist:5 -> a list in its own order (needs login)
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const user = getSessionUser(event)

    if (query.ids) {
        const ids = String(query.ids).split(',').map(Number).filter(Number.isInteger).slice(0, 50)
        return { total: ids.length, items: await loadTracks(ids, user?.id) }
    }

    const offset = Math.max(Number(query.offset) || 0, 0)

    if (query.source) {
        const owner = requireUser(event)
        const { ids, label } = listSource(String(query.source), owner)
        const limit = Math.min(Math.max(Number(query.limit) || 200, 1), 500)
        return { total: ids.length, label, items: await loadTracks(ids.slice(offset, offset + limit), owner.id) }
    }

    await syncLibrary()
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 30)
    const seed = Number(query.seed) || 1

    const all = useDb().prepare('SELECT id FROM tracks ORDER BY id').all().map((r) => r.id)
    const page = shuffled(all, seed).slice(offset, offset + limit)
    return { total: all.length, items: await loadTracks(page, user?.id) }
})
