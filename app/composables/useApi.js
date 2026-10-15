export const useApi = () => ({
  auth: {
    me: (headers) => $fetch('/api/auth/me', { headers }),
    signIn: (payload) => $fetch('/api/auth/sign_in', { method: 'POST', body: payload }),
    signUp: (payload) => $fetch('/api/auth/sign_up', { method: 'POST', body: payload }),
    logout: () => $fetch('/api/auth/logout', { method: 'DELETE' })
  },
  loader: {
    loadSongs: () => $fetch('/api/songs'),
    addComment: (songId, payload) =>
      $fetch(`/api/songs/${songId}/comments`, { method: 'POST', body: payload })
  }
})