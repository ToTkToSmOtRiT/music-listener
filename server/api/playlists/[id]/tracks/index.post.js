// POST /api/playlists/ID/tracks { trackId } -> append a track (adding twice is a no-op)
export default defineEventHandler(async (event) => {
    const playlist = requirePlaylist(event, requireUser(event))
    const trackId = Number(((await readBody(event)) || {}).trackId)
    if (!trackExists(trackId)) throw createError({ statusCode: 404, statusMessage: 'Track not found' })
    const added = addToPlaylist(playlist.id, trackId)
    if (added) setResponseStatus(event, 201)
    return { added, count: playlistTrackIds(playlist.id).length }
})
