// GET /api/foryou/profile -> what "For you" currently knows about this user (for the settings window)
export default defineEventHandler((event) => tasteProfile(requireUser(event).id))
