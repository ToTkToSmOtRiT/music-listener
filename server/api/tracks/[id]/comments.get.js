export default defineEventHandler((event) => listComments(requireTrack(event).id))
