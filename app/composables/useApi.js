export const useApi = () => ({
  auth: {
    me: (headers) => $fetch('/api/auth/me', { headers }),
    signIn: (payload) => $fetch('/api/auth/sign_in', { method: 'POST', body: payload }),
    signUp: (payload) => $fetch('/api/auth/sign_up', { method: 'POST', body: payload }),
    logout: () => $fetch('/api/auth/logout', { method: 'DELETE' })
  },
  collection: (type) => $fetch('/api/collection', { query: { type } }),
  search: (q) => $fetch('/api/search', { query: { q } }),
  library: {
    get: () => $fetch('/api/library'),
    save: (dir) => $fetch('/api/library', { method: 'PUT', body: { dir } }),
    rescan: () => $fetch('/api/library/rescan', { method: 'POST' })
  },
  tracks: {
    page: (query) => $fetch('/api/tracks', { query }),
    byIds: (ids) => $fetch('/api/tracks', { query: { ids: ids.join(',') } }),
    comments: (id) => $fetch(`/api/tracks/${id}/comments`),
    addComment: (id, payload) => $fetch(`/api/tracks/${id}/comments`, { method: 'POST', body: payload }),
    setFlag: (id, kind, on) => $fetch(`/api/tracks/${id}/${kind}`, { method: on ? 'POST' : 'DELETE' })
  },
  playlists: {
    list: (trackId) => $fetch('/api/playlists', { query: trackId == null ? {} : { track: trackId } }),
    create: (name, trackId) => $fetch('/api/playlists', { method: 'POST', body: { name, trackId } }),
    get: (id) => $fetch(`/api/playlists/${id}`),
    rename: (id, name) => $fetch(`/api/playlists/${id}`, { method: 'PATCH', body: { name } }),
    remove: (id) => $fetch(`/api/playlists/${id}`, { method: 'DELETE' }),
    addTrack: (id, trackId) => $fetch(`/api/playlists/${id}/tracks`, { method: 'POST', body: { trackId } }),
    removeTrack: (id, trackId) => $fetch(`/api/playlists/${id}/tracks/${trackId}`, { method: 'DELETE' }),
    reorder: (id, ids) => $fetch(`/api/playlists/${id}/order`, { method: 'PUT', body: { ids } })
  }
})
