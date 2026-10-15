export const useUser = () => useState('user', () => null)

export function setUser(user) {
  useUser().value = user
}

export function clearUser() {
  useUser().value = null
}