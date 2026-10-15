export default defineEventHandler((event) => ({ favourited: setFlag(event, 'favourites', false).on }))
