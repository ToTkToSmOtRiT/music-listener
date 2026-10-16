// Background scan that reads every track's tags once (artist, title, cover, genre) so genres can be
// browsed without opening each song first. It only reads files; it never writes to the music folder.
const state = { running: false, done: 0, total: 0 }

export const scanStatus = () => ({ ...state })

const CONCURRENCY = 4
const REBUILD_EVERY = 300 // refresh the genre lists while the scan is still running

async function scanOne(row, update) {
    const file = resolveTrackFile(row.src, row.lib_root)
    let tags = null
    try {
        tags = file ? await readTags(file) : null
    } catch (error) {
        // unreadable tags: the track just stays without a genre
    }
    const raw = tags?.genres.length ? tags.genres.join(' | ') : null
    if (tags && !row.meta_done) {
        update.full.run(tags.artist, tags.title, tags.hasCover ? 1 : 0, raw, row.id)
    } else {
        update.genreOnly.run(raw, row.id)
    }
}

export function startTagScan() {
    if (state.running) return
    const db = useDb()
    const rows = db.prepare('SELECT id, src, lib_root, meta_done FROM tracks WHERE genre_done = 0 AND available = 1').all()

    if (!rows.length) {
        if (!genresAreCurrent()) rebuildGenres() // taxonomy changed: no file reads needed
        return
    }

    const update = {
        full: db.prepare(`UPDATE tracks SET artist = COALESCE(?, artist), title = COALESCE(?, title),
            has_cover = ?, meta_done = 1, genre_raw = ?, genre_done = 1 WHERE id = ?`),
        genreOnly: db.prepare('UPDATE tracks SET genre_raw = ?, genre_done = 1 WHERE id = ?'),
    }

    state.running = true
    state.done = 0
    state.total = rows.length
    let next = 0

    const worker = async () => {
        while (next < rows.length) {
            await scanOne(rows[next++], update)
            if (++state.done % REBUILD_EVERY === 0) rebuildGenres()
        }
    }

    Promise.all(Array.from({ length: CONCURRENCY }, worker))
        .then(() => rebuildGenres())
        .catch((error) => console.error('Tag scan failed:', error.message))
        .finally(() => { state.running = false })
}
