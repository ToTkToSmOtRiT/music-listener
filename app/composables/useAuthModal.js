// Shared state for the login / sign up popup so any component can open it.
export const useAuthModal = () => useState('authModal', () => ({ open: false, login: true }))

export function openAuth(login = true) {
  useAuthModal().value = { open: true, login }
}
