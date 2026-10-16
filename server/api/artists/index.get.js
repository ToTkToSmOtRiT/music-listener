// GET /api/artists                -> every genre (and "unsorted") with the artists that have tracks in it
// GET /api/artists?genre=rock     -> just that genre's artists, A to Z
// Artists are listed under every genre one of their tracks belongs to; each count is the number of
// that artist's tracks in that genre.
export default defineEventHandler((event) => {
    requireUser(event)
    const index = artistIndex()
    const wanted = getQuery(event).genre ? String(getQuery(event).genre) : ''

    const listFor = (slug) => {
        const out = []
        for (const a of index.values()) {
            const count = slug === 'unsorted' ? a.unsorted : (a.byGenre.get(slug) ?? 0)
            if (count > 0) out.push({ key: a.key, name: a.name, count })
        }
        return out
    }
    const labelOf = (slug) => (slug === 'unsorted' ? 'Unsorted' : GENRE_BY_SLUG[slug].label)

    if (wanted) {
        if (wanted !== 'unsorted' && !GENRE_BY_SLUG[wanted]) {
            throw createError({ statusCode: 404, statusMessage: 'Unknown genre' })
        }
        const artists = listFor(wanted).sort((a, b) => compareNames(a.name, b.name))
        return { genre: { slug: wanted, label: labelOf(wanted) }, artists }
    }

    const groups = [...GENRES.map((g) => g.slug), 'unsorted']
        .map((slug) => {
            const artists = listFor(slug).sort((a, b) => b.count - a.count || compareNames(a.name, b.name))
            return { slug, label: labelOf(slug), artists }
        })
        .filter((g) => g.artists.length)
        // biggest genres first, "unsorted" always last
        .sort((a, b) => (a.slug === 'unsorted') - (b.slug === 'unsorted') || b.artists.length - a.artists.length)
    return { groups }
})
