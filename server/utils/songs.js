export function loadSongs() {
    const db = useDb()
    const tracks = db.prepare('SELECT id, artist, title AS song, src FROM tracks ORDER BY id').all()
    const comments = db.prepare(
        'SELECT id, track_id, author_name AS name, body AS comment FROM comments ORDER BY id'
    ).all()

    const byTrack = new Map(tracks.map((t) => [t.id, []]))
    for (const { track_id, ...comment } of comments) byTrack.get(track_id)?.push({ ...comment })
    return tracks.map((t) => ({ ...t, comments: byTrack.get(t.id) }))
}

export function addComment(trackId, user, body) {
    const db = useDb()
    if (!db.prepare('SELECT 1 FROM tracks WHERE id = ?').get(trackId)) return null
    const { lastInsertRowid } = db
        .prepare('INSERT INTO comments (track_id, user_id, author_name, body) VALUES (?, ?, ?, ?)')
        .run(trackId, user.id, user.username, body)
    return { id: Number(lastInsertRowid), name: user.username, comment: body }
}
