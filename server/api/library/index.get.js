// GET /api/library -> the music folder setting and how many tracks it holds (login required)
export default defineEventHandler((event) => {
    requireUser(event)
    return libraryPayload(event)
})
