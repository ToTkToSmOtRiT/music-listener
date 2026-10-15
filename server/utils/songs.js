export function listComments(trackId) {
    return useDb().prepare(`
        SELECT id, author_name AS name, body AS comment, created_at
        FROM comments WHERE track_id = ? ORDER BY id DESC LIMIT 200
    `).all(trackId).map((c) => ({ ...c }))
}

export function addComment(trackId, user, body) {
    const db = useDb()
    const { lastInsertRowid } = db
        .prepare('INSERT INTO comments (track_id, user_id, author_name, body) VALUES (?, ?, ?, ?)')
        .run(trackId, user.id, user.username, body)
    return db.prepare('SELECT id, author_name AS name, body AS comment, created_at FROM comments WHERE id = ?')
        .get(Number(lastInsertRowid))
}
