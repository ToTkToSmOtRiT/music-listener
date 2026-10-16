// PATCH /api/playlists/ID { name } -> rename
export default defineEventHandler(async (event) => {
    const playlist = requirePlaylist(event, requireUser(event))
    const name = cleanName(((await readBody(event)) || {}).name)
    useDb().prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name, playlist.id)
    return { id: playlist.id, name }
})
