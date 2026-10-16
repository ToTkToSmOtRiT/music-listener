// GET /api/foryou?limit=10&exclude=1,2,3 -> the next tracks picked for this user.
// `exclude` lists tracks the page already holds, so nothing is offered twice in a session.
// Each item carries a `reason` ("Because you like Rock") for the player to show.
export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const query = getQuery(event)
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 30)
    const exclude = String(query.exclude ?? '').split(',').map(Number).filter(Number.isInteger).slice(0, 500)

    if (!foryouEnabled(user.id)) {
        throw createError({ statusCode: 409, statusMessage: 'For you is turned off' })
    }

    const { picks, learning } = forYouPicks(user.id, limit, exclude)
    const tracks = await loadTracks(picks.map((p) => p.id), user.id)
    const reasons = new Map(picks.map((p) => [p.id, p.reason]))
    return { learning, items: tracks.map((t) => ({ ...t, reason: reasons.get(t.id) })) }
})
