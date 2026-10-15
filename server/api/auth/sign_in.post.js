export default defineEventHandler(async (event) => publicUser(await readCredentials(event)))
