export const THEMES = ['ivory', 'ebony']

// The chosen theme lives in a cookie, so the server renders the right colours
// on the first paint (no flash) and the choice is remembered between visits.
export function useTheme() {
  const cookie = useCookie('theme', {
    default: () => 'ebony',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })
  return computed({
    get: () => (THEMES.includes(cookie.value) ? cookie.value : 'ebony'),
    set: (value) => {
      if (THEMES.includes(value)) cookie.value = value
    }
  })
}
