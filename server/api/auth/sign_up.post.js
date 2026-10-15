export default defineEventHandler(async (event) => {
  const user = publicUser(await readCredentials(event))
  setResponseStatus(event, 201)
  return user
})
