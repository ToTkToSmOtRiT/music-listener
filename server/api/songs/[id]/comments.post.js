export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, comment } = body || {}
  if (typeof comment !== 'string' || !comment.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Comment is required' })
  }
  const added = await addComment(Number(getRouterParam(event, 'id')), {
    name: typeof name === 'string' && name.trim() ? name.trim() : 'Anonymous',
    comment: comment.trim()
  })
  if (!added) throw createError({ statusCode: 404, statusMessage: 'Song not found' })
  setResponseStatus(event, 201)
  return added
})
