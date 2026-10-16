// The cover art embedded in the audio file's own tags.
export default defineEventHandler(async (event) => {
    requireUser(event)
    const track = requireTrack(event)
    const file = track.has_cover && track.available ? resolveTrackFile(track.src, track.lib_root) : null
    const cover = file && (await readCover(file).catch(() => null))
    if (!cover) throw createError({ statusCode: 404, statusMessage: 'No cover' })
    setHeader(event, 'Content-Type', cover.type)
    setHeader(event, 'Cache-Control', 'private, max-age=86400')
    return cover.data
})
