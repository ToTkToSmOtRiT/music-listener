// GET /api/genres -> the genres found in the library with their track counts,
// the number of tracks without any genre, and the progress of the background tag scan.
export default defineEventHandler(async () => {
    await syncLibrary()
    const db = useDb()

    const counts = db.prepare('SELECT tg.genre AS genre, COUNT(*) AS n FROM track_genres tg JOIN tracks t ON t.id = tg.track_id WHERE t.available = 1 GROUP BY tg.genre').all()
    const items = counts
        .filter((c) => GENRE_BY_SLUG[c.genre])
        .map((c) => ({ slug: c.genre, label: GENRE_BY_SLUG[c.genre].label, count: c.n }))
        .sort((a, b) => b.count - a.count || GENRE_BY_SLUG[a.slug].order - GENRE_BY_SLUG[b.slug].order)

    const { total } = db.prepare('SELECT COUNT(*) AS total FROM tracks WHERE available = 1').get()
    const { unsorted } = db.prepare('SELECT COUNT(*) AS unsorted FROM tracks WHERE available = 1 AND id NOT IN (SELECT track_id FROM track_genres)').get()

    return { total, unsorted, scanning: scanStatus(), items }
})
