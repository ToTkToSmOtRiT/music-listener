// GET /api/playlists/ID -> the playlist with its tracks in play order
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const playlist = requirePlaylist(event, user)
    const ids = playlistTrackIds(playlist.id)
    const added = new Map(
        useDb().prepare('SELECT track_id, added_at FROM playlist_tracks WHERE playlist_id = ?')
            .all(playlist.id).map((r) => [r.track_id, r.added_at])
    )
    const tracks = (await loadTracks(ids, user.id)).map((t) => ({ ...t, addedAt: added.get(t.id) }))
    return { id: playlist.id, name: playlist.name, tracks }
})
