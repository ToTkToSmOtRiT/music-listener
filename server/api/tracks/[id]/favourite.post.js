export default defineEventHandler((event) => ({ favourited: setFlag(event, 'favourites', true).on }))
