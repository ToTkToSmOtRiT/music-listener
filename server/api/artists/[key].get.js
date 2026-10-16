// GET /api/artists/<key> -> one artist with all their tracks (by title)
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const artist = artistIndex().get(String(getRouterParam(event, 'key') ?? '').trim().toLowerCase())
    if (!artist) throw createError({ statusCode: 404, statusMessage: 'Artist not found' })

    const tracks = await loadTracks(artistTrackIds(artist).slice(0, 300), user.id)
    const genres = [...artist.byGenre.keys()]
        .map((slug) => GENRE_BY_SLUG[slug])
        .filter(Boolean)
        .sort((a, b) => a.order - b.order)
        .map((g) => ({ slug: g.slug, label: g.label }))
    return { key: artist.key, name: artist.name, genres, tracks }
})
