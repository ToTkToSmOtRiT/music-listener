// Placeholder auth: no credential check or persistence yet. Never echo the password back.
export function publicUser(body) {
  const { email, username } = body || {}
  return { email, username: username || (email ? email.split('@')[0] : undefined) }
}

export async function readCredentials(event) {
  const body = await readBody(event)
  const { email, password } = body || {}
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }
  return body
}
