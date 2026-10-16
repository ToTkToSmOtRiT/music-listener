// Shared state for the login / sign up popup so any component can open it.
// `reason` is an optional sentence shown under the title ("Log in to start listening.").
export const useAuthModal = () => useState('authModal', () => ({ open: false, login: true, reason: '' }))

export function openAuth(login = true, reason = '') {
  useAuthModal().value = { open: true, login, reason }
}