const USER_KEY = 'user'

export const useUser = () => useState('user', () => null)

export function loadStoredUser() {
  try {
    useUser().value = JSON.parse(localStorage.getItem(USER_KEY))
  } catch (error) {
    localStorage.removeItem(USER_KEY)
  }
}

export function setUser(payload) {
  localStorage.setItem(USER_KEY, JSON.stringify(payload))
  useUser().value = payload
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
  useUser().value = null
}
