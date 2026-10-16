// DELETE /api/playlists/ID/tracks/TRACK -> remove a track and close the gap in the order
export default defineEventHandler((event) => {
    const user = requireUser(event)
    const playlist = requirePlaylist(event, user)
    const trackId = Number(getRouterParam(event, 'trackId'))
    const db = useDb()
    const removed = db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlist.id, trackId).changes
    if (removed) addSignal(user.id, trackId, -SIGNAL.playlist)

    const update = db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?')
    db.exec('BEGIN')
    try {
        playlistTrackIds(playlist.id).forEach((id, i) => update.run(i, playlist.id, id))
        db.exec('COMMIT')
    } catch (error) {
        db.exec('ROLLBACK')
        throw error
    }
    return { count: playlistTrackIds(playlist.id).length }
})
