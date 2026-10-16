// DELETE /api/playlists/ID -> delete the playlist (the tracks themselves are not touched)
export default defineEventHandler((event) => {
    const playlist = requirePlaylist(event, requireUser(event))
    useDb().prepare('DELETE FROM playlists WHERE id = ?').run(playlist.id)
    setResponseStatus(event, 204)
    return null
})
