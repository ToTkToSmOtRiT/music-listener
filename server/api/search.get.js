// GET /api/search?q=text -> up to 20 tracks whose artist or title contain every word.
// Whole-phrase matches (and titles that start with the phrase) come first.
export default defineEventHandler(async (event) => {
    const phrase = String(getQuery(event).q ?? '').toLocaleLowerCase().trim().replace(/\s+/g, ' ')
    const words = phrase.split(' ').filter(Boolean)
    if (!words.length || words.join('').length < 2) return { items: [] }

    // Filtered in JS rather than SQL LIKE so non-ASCII names match case-insensitively.
    const ids = useDb().prepare('SELECT id, artist, title FROM tracks').all()
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

    return { items: await loadTracks(ids, getSessionUser(event)?.id) }
})
