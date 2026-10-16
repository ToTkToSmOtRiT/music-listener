// POST /api/library/rescan -> look for new or removed files in the music folder now
export default defineEventHandler(async (event) => {
    requireUser(event)
    requireLocal(event)
    await rescanLibrary()
    return libraryPayload(event)
})
