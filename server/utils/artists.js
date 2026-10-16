const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })
export const compareNames = (a, b) => collator.compare(a, b)

// All artists of the tracks in the current music folder, grouped by primary artist name.
// For each artist: its track ids, and how many of its tracks fall in each genre (or in none).
// Built per request: a few thousand rows, so it is quick and always matches the current folder.
export function artistIndex() {
    const db = useDb()
    const tracks = db.prepare('SELECT id, artist, title FROM tracks WHERE available = 1').all()
    const genreRows = db.prepare(
        'SELECT tg.track_id AS id, tg.genre AS genre FROM track_genres tg JOIN tracks t ON t.id = tg.track_id WHERE t.available = 1'
    ).all()

    const genresOf = new Map()
    for (const { id, genre } of genreRows) genresOf.set(id, [...(genresOf.get(id) ?? []), genre])

    const index = new Map()
    for (const t of tracks) {
        const key = artistKey(t.artist)
        if (!key) continue
        let a = index.get(key)
        if (!a) {
            a = { key, name: primaryArtist(t.artist), tracks: [], byGenre: new Map(), unsorted: 0 }
            index.set(key, a)
        }
        a.tracks.push({ id: t.id, title: t.title })
        const genres = genresOf.get(t.id) ?? []
        if (!genres.length) a.unsorted++
        for (const g of genres) a.byGenre.set(g, (a.byGenre.get(g) ?? 0) + 1)
    }
    return index
}

// Track ids of one artist, by title.
export const artistTrackIds = (artist) =>
    [...artist.tracks].sort((x, y) => compareNames(x.title, y.title)).map((t) => t.id)
