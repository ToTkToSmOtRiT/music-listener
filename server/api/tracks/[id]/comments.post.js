export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const track = requireTrack(event)
    const { comment } = (await readBody(event)) || {}
    if (typeof comment !== 'string' || !comment.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'Comment is required' })
    }
    if (comment.length > 2000) {
        throw createError({ statusCode: 400, statusMessage: 'Comment is too long (max 2000 characters)' })
    }
    setResponseStatus(event, 201)
    return addComment(track.id, user, comment.trim())
})
