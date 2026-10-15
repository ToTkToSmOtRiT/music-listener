export const useApi = () => ({
  auth: {
    me: (headers) => $fetch('/api/auth/me', { headers }),
    signIn: (payload) => $fetch('/api/auth/sign_in', { method: 'POST', body: payload }),
    signUp: (payload) => $fetch('/api/auth/sign_up', { method: 'POST', body: payload }),
    logout: () => $fetch('/api/auth/logout', { method: 'DELETE' })
  },
  collection: (type) => $fetch('/api/collection', { query: { type } }),
  tracks: {
    page: (query) => $fetch('/api/tracks', { query }),
    byIds: (ids) => $fetch('/api/tracks', { query: { ids: ids.join(',') } }),
    comments: (id) => $fetch(`/api/tracks/${id}/comments`),
    addComment: (id, payload) => $fetch(`/api/tracks/${id}/comments`, { method: 'POST', body: payload }),
    setFlag: (id, kind, on) => $fetch(`/api/tracks/${id}/${kind}`, { method: on ? 'POST' : 'DELETE' })
  }
})
