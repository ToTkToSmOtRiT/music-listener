export default defineEventHandler((event) => {
    requireUser(event)
    return listComments(requireTrack(event).id)
})
