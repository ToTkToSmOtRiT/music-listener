// GET /api/playlists[?track=ID] -> my playlists (with `has` = already contains that track)
export default defineEventHandler((event) => {
    const user = requireUser(event)
    const track = getQuery(event).track
    return listPlaylists(user.id, track === undefined ? null : Number(track))
})
