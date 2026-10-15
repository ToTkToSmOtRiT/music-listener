export default defineEventHandler((event) => {
    destroySession(event)
    setResponseStatus(event, 200)
    return null
})
