// GET /api/account -> the logged-in user's account information and a few counts (Profile > Account info)
export default defineEventHandler((event) => {
    const user = requireUser(event)
    const db = useDb()
    const count = (sql) => db.prepare(sql).get(user.id).n

    const { created_at } = db.prepare('SELECT created_at FROM users WHERE id = ?').get(user.id)
    return {
        username: user.username,
        email: user.email,
        createdAt: created_at,
        stats: {
            saved: count('SELECT COUNT(*) AS n FROM favourites WHERE user_id = ?'),
            liked: count('SELECT COUNT(*) AS n FROM likes WHERE user_id = ?'),
            playlists: count('SELECT COUNT(*) AS n FROM playlists WHERE user_id = ?'),
            comments: count('SELECT COUNT(*) AS n FROM comments WHERE user_id = ?')
        }
    }
})
