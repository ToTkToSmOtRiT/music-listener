// POST /api/plays { trackId, listened, duration } -> a track has just been listened to (or skipped).
// The player sends this when it moves on from a track that actually started playing.
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const body = (await readBody(event)) || {}
    const trackId = Number(body.trackId)
    if (!Number.isInteger(trackId)) throw createError({ statusCode: 400, statusMessage: 'trackId is required' })
    const result = recordPlay(user.id, trackId, body.listened, body.duration)
    setResponseStatus(event, 202)
    return { recorded: Boolean(result) }
})
