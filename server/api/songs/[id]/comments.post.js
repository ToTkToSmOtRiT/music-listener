export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const { comment } = (await readBody(event)) || {}
    if (typeof comment !== 'string' || !comment.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'Comment is required' })
    }
    if (comment.length > 2000) {
        throw createError({ statusCode: 400, statusMessage: 'Comment is too long (max 2000 characters)' })
    }
    const added = addComment(Number(getRouterParam(event, 'id')), user, comment.trim())
    if (!added) throw createError({ statusCode: 404, statusMessage: 'Song not found' })
    setResponseStatus(event, 201)
    return added
})
