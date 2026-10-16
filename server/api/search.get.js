// GET /api/search?q=text -> { artists, items }
//   artists: up to 8 artists whose name contains every word (most tracks first)
//   items:   up to 20 tracks whose artist or title contain every word
// Whole-phrase matches (and titles that start with the phrase) come first.
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const phrase = String(getQuery(event).q ?? '').toLocaleLowerCase().trim().replace(/\s+/g, ' ')
    const words = phrase.split(' ').filter(Boolean)
    if (!words.length || words.join('').length < 2) return { artists: [], items: [] }

    // Filtered in JS rather than SQL LIKE so non-ASCII names match case-insensitively.
    const ids = useDb().prepare('SELECT id, artist, title FROM tracks WHERE available = 1').all()
        .map((t) => {
            const title = t.title.toLocaleLowerCase()
            const hay = `${t.artist} ${t.title}`.toLocaleLowerCase()
            if (!words.every((w) => hay.includes(w))) return null
            const rank = title.startsWith(phrase) ? 0 : hay.includes(phrase) ? 1 : 2
            return { id: t.id, rank, title }
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
        .slice(0, 20)
        .map((t) => t.id)

    const artists = [...artistIndex().values()]
        .filter((a) => words.every((w) => a.name.toLocaleLowerCase().includes(w)))
        .map((a) => ({ key: a.key, name: a.name, count: a.tracks.length, starts: a.key.startsWith(phrase) }))
        .sort((a, b) => Number(b.starts) - Number(a.starts) || b.count - a.count || compareNames(a.name, b.name))
        .slice(0, 8)
        .map(({ key, name, count }) => ({ key, name, count }))

    return { artists, items: await loadTracks(ids, user.id) }
})
