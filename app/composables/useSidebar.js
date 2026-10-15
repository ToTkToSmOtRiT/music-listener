// Desktop: the menu is either expanded (icons + labels) or collapsed (icons only),
// remembered in a cookie so the server renders the right width on first paint.
// Phones: the menu is a drawer that is closed by default.
export function useSidebar() {
  const cookie = useCookie('sidebar', {
    default: () => 'expanded',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })
  const collapsed = computed(() => cookie.value === 'collapsed')
  const open = useState('sidebarOpen', () => false)

  return {
    collapsed,
    open,
    toggleCollapsed: () => { cookie.value = collapsed.value ? 'expanded' : 'collapsed' },
    openDrawer: () => { open.value = true },
    closeDrawer: () => { open.value = false }
  }
}
