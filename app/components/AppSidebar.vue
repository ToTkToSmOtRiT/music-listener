<template>
    <div>
        <div v-if="open" class="sidebar-scrim" @click="closeDrawer" />

        <aside id="sidebar" class="sidebar" :class="{ 'sidebar--collapsed': collapsed, 'sidebar--open': open }"
            aria-label="Main menu">
            <div class="sidebar__top">
                <button type="button" class="sidebar__toggle" :aria-expanded="!collapsed"
                    :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'" @click="onToggle">
                    <AppIcon :name="open ? 'close' : 'menu'" />
                </button>
                <NuxtLink to="/" class="sidebar__logo">Music Listener</NuxtLink>
            </div>

            <nav class="sidebar__nav">
                <ul>
                    <li v-for="item in items" :key="item.to">
                        <!-- Playlists: a button that drops its lists out right here in the menu -->
                        <template v-if="item.drop">
                            <button type="button" class="sidebar__link sidebar__link--btn"
                                :class="{ 'is-active': route.path.startsWith('/playlists') }" aria-controls="sidebar-lists"
                                :aria-expanded="listsOpen" :title="collapsed ? item.label : undefined" @click="toggleLists">
                                <AppIcon :name="item.icon" />
                                <span class="sidebar__label">{{ item.label }}</span>
                                <AppIcon name="down" :size="16" class="sidebar__chev sidebar__label"
                                    :class="{ 'is-open': listsOpen }" />
                            </button>
                            <ul v-if="listsOpen && showFull" id="sidebar-lists" class="sidebar__sub">
                                <li v-for="s in special" :key="s.key">
                                    <NuxtLink :to="`/playlists/${s.key}`" class="sidebar__sublink sidebar__sublink--pinned"
                                        exact-active-class="is-active">
                                        <AppIcon :name="s.key === 'saved' ? 'star' : 'heart'" :size="16" />
                                        <span>{{ s.name }}</span><small>{{ s.count }}</small>
                                    </NuxtLink>
                                </li>
                                <li v-for="p in lists" :key="p.id">
                                    <NuxtLink :to="`/playlists/${p.id}`" class="sidebar__sublink" exact-active-class="is-active">
                                        <AppIcon name="playlist" :size="16" />
                                        <span>{{ p.name }}</span><small>{{ p.count }}</small>
                                    </NuxtLink>
                                </li>
                                <li>
                                    <NuxtLink to="/playlists" class="sidebar__sublink sidebar__sublink--all"
                                        exact-active-class="is-active">
                                        <AppIcon name="plus" :size="16" />
                                        <span>All playlists / new</span>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </template>
                        <NuxtLink v-else :to="item.to" class="sidebar__link" exact-active-class="is-active"
                            active-class="is-active" :title="collapsed ? item.label : undefined">
                            <AppIcon :name="item.icon" />
                            <span class="sidebar__label">{{ item.label }}</span>
                            <span v-if="item.soon" class="sidebar__soon sidebar__label">Soon</span>
                        </NuxtLink>
                    </li>
                </ul>
            </nav>

            <div class="sidebar__bottom">
                <ThemeSwitch v-if="!collapsed || open" class="sidebar__theme" />
                <button v-else type="button" class="sidebar__link sidebar__link--btn"
                    :title="`Switch to ${theme === 'ebony' ? 'Ivory' : 'Ebony'} theme`" aria-label="Switch theme"
                    @click="theme = theme === 'ebony' ? 'ivory' : 'ebony'">
                    <AppIcon :name="theme === 'ebony' ? 'sun' : 'moon'" />
                </button>

                <div class="sidebar__user" :title="user?.email">
                    <span class="sidebar__avatar">{{ user?.username.charAt(0).toUpperCase() }}</span>
                    <span class="sidebar__label sidebar__name">{{ user?.username }}</span>
                </div>
                <button type="button" class="sidebar__link sidebar__link--btn" title="Log out" @click="logout">
                    <AppIcon name="logout" />
                    <span class="sidebar__label">Log out</span>
                </button>
            </div>
        </aside>
    </div>
</template>

<script setup>
const user = useUser()
const theme = useTheme()
const route = useRoute()
const { collapsed, open, toggleCollapsed, closeDrawer } = useSidebar()

const items = [
    { to: '/feed', label: 'Feed', icon: 'feed', soon: true },
    { to: '/news', label: 'News', icon: 'news', soon: true },
    { to: '/listener', label: 'Listen', icon: 'listen' },
    { to: '/library', label: 'Library', icon: 'library' },
    { to: '/profile', label: 'Profile', icon: 'user' },
    { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions', soon: true },
    { to: '/playlists', label: 'Playlists', icon: 'playlist', drop: true },
]

// Playlists drop-out: Saved and Liked pinned on top, then the user's own playlists.
const api = useApi()
const listsOpen = ref(false)
const special = ref([])
const lists = ref([])
// the rail is icons only; the list needs the full menu (always full inside the phone drawer)
const showFull = computed(() => !collapsed.value || open.value)

async function loadLists() {
  if (!user.value) return
  try {
    const [pinned, own] = await Promise.all([api.playlists.special(), api.playlists.list()])
    special.value = pinned
    lists.value = own
  } catch (error) {
    // keep the previous list; the full page shows errors
  }
}

function toggleLists() {
  // from the collapsed rail, a click unfolds the menu and shows the lists
  if (collapsed.value && !open.value) {
    toggleCollapsed()
    listsOpen.value = true
  } else {
    listsOpen.value = !listsOpen.value
  }
  if (listsOpen.value) loadLists()
}

// counts and names change while listening and editing: refresh on navigation while it is open
watch(() => route.fullPath, () => { if (listsOpen.value) loadLists() })
watch(user, (u) => { if (!u) { listsOpen.value = false; special.value = []; lists.value = [] } })

// The button folds the menu on desktop and closes the drawer on phones.
function onToggle() {
    if (open.value) closeDrawer()
    else toggleCollapsed()
}

watch(() => route.path, closeDrawer)

const logout = useLogout()
</script>

<style lang="scss">
.sidebar {
    --sb-w: 252px;

    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex: none;
    flex-direction: column;
    align-self: flex-start;
    width: var(--sb-w);
    height: 100dvh;
    padding: 12px 10px;
    overflow: hidden;
    border-right: 1px solid var(--line);
    background: var(--bg);
    text-align: left;
    transition: width 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;

    &--collapsed {
        --sb-w: 68px;
    }

    &__top {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        margin-bottom: 14px;
    }

    &__toggle {
        display: grid;
        flex: none;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: var(--text);
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
            background: var(--bg-sunk);
        }
    }

    &__logo {
        overflow: hidden;
        font-family: 'Aboreto', var(--font-display);
        font-size: 17px;
        letter-spacing: 0.06em;
        text-decoration: none;
        white-space: nowrap;
        color: var(--text);
    }

    &__nav {
        flex: 1;
        min-height: 0;
        overflow-y: auto;

        ul {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
    }

    &__link {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        height: 44px;
        padding: 0 11px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        font-size: 15px;
        text-decoration: none;
        white-space: nowrap;
        color: var(--text-2);
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;

        .icon {
            flex: none;
        }

        &:hover {
            background: var(--bg-sunk);
            color: var(--text);
        }

        &.is-active {
            background: var(--bg-sunk);
            color: var(--text);
            box-shadow: inset 3px 0 0 var(--accent);
        }
    }

    &__chev {
        margin-left: auto;
        transition: transform 0.2s;

        &.is-open {
            transform: rotate(180deg);
        }
    }

    /* the drop-out list under Playlists */
    &__sub {
        display: flex;
        flex-direction: column;
        gap: 1px;
        max-height: 40dvh;
        margin: 2px 0 6px 22px;
        padding-left: 10px;
        overflow-y: auto;
        border-left: 1px solid var(--line-strong);
    }

    &__sublink {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 36px;
        padding: 0 10px;
        border-radius: 10px;
        font-size: 14px;
        text-decoration: none;
        color: var(--text-2);
        transition: background-color 0.2s, color 0.2s;

        .icon {
            flex: none;
        }

        span {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        small {
            font-size: 12px;
            color: var(--text-3);
        }

        &:hover,
        &.is-active {
            background: var(--bg-sunk);
            color: var(--text);
        }

        &--pinned .icon {
            color: var(--accent);
        }

        &--all {
            color: var(--text-3);
        }
    }

    &__soon {
        margin-left: auto;
        padding: 1px 8px;
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        font-size: 11px;
        color: var(--text-3);
    }

    &__bottom {
        display: flex;
        flex: none;
        flex-direction: column;
        gap: 6px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
    }

    &__theme {
        align-self: flex-start;
        margin: 0 0 4px 2px;
    }

    &__user {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 44px;
        padding: 0 8px;
        overflow: hidden;
    }

    &__avatar {
        display: grid;
        flex: none;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--accent);
        font-size: 13px;
        font-weight: 500;
        color: var(--accent-ink);
    }

    &__name {
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__signup {
        width: 100%;
    }

    // Collapsed: icons only.
    &--collapsed &__label,
    &--collapsed &__logo {
        display: none;
    }

    &--collapsed &__link,
    &--collapsed &__user {
        justify-content: center;
        padding: 0;
    }

    &--collapsed &__link.is-active {
        box-shadow: none;
        outline: 1px solid var(--line-strong);
    }

    &--collapsed &__signup {
        display: none;
    }
}

.sidebar-scrim {
    display: none;
}

.topbar {
    display: none;
}

// Phones: a slim top bar opens the menu as a drawer.
@media (max-width: 767px) {
    .sidebar {
        --sb-w: 272px;

        position: fixed;
        inset: 0 auto 0 0;
        transform: translateX(-102%);

        &--collapsed {
            --sb-w: 272px;
        }

        &--open {
            transform: translateX(0);
            box-shadow: var(--shadow);
        }

        // In the drawer the menu is always shown in full.
        &--collapsed &__label,
        &--collapsed &__logo {
            display: initial;
        }

        &--collapsed &__link,
        &--collapsed &__user {
            justify-content: flex-start;
            padding: 0 11px;
        }

        &--collapsed &__signup {
            display: inline-flex;
        }
    }

    .sidebar-scrim {
        position: fixed;
        inset: 0;
        z-index: 45;
        display: block;
        background: rgba(0, 0, 0, 0.5);
    }

    .topbar {
        position: relative;
        z-index: 10;
        display: flex;
        flex: none;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-bottom: 1px solid var(--line);
        background: var(--bg);

        button {
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border: 0;
            border-radius: 12px;
            background: transparent;
            color: var(--text);
            cursor: pointer;
        }

        a {
            font-family: 'Aboreto', var(--font-display);
            font-size: 17px;
            letter-spacing: 0.06em;
            text-decoration: none;
        }
    }
}
</style>
