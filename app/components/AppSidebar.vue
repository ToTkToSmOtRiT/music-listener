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
                        <NuxtLink :to="item.to" class="sidebar__link" exact-active-class="is-active"
                            :title="collapsed ? item.label : undefined">
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

                <template v-if="user">
                    <div class="sidebar__user" :title="user.email">
                        <span class="sidebar__avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
                        <span class="sidebar__label sidebar__name">{{ user.username }}</span>
                    </div>
                    <button type="button" class="sidebar__link sidebar__link--btn" title="Log out" @click="logout">
                        <AppIcon name="logout" />
                        <span class="sidebar__label">Log out</span>
                    </button>
                </template>
                <template v-else>
                    <button type="button" class="sidebar__link sidebar__link--btn" title="Log in" @click="openAuth(true)">
                        <AppIcon name="login" />
                        <span class="sidebar__label">Log in</span>
                    </button>
                    <button type="button" class="btn btn--solid sidebar__signup sidebar__label"
                        @click="openAuth(false)">Sign up</button>
                </template>
            </div>
        </aside>

        <AuthModal :open="modal.open" :mode="modal.login" @close="modal.open = false"
            @switch="modal.login = !modal.login" />
    </div>
</template>

<script setup>
const api = useApi()
const user = useUser()
const modal = useAuthModal()
const theme = useTheme()
const route = useRoute()
const { collapsed, open, toggleCollapsed, closeDrawer } = useSidebar()

const items = [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/listener', label: 'Listen', icon: 'listen' },
    { to: '/collection', label: 'My collection', icon: 'collection' },
    { to: '/feed', label: 'Feed', icon: 'feed', soon: true },
    { to: '/news', label: 'News', icon: 'news', soon: true },
    { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions', soon: true },
    { to: '/playlists', label: 'Playlist', icon: 'playlist', soon: true },
]

// The button folds the menu on desktop and closes the drawer on phones.
function onToggle() {
    if (open.value) closeDrawer()
    else toggleCollapsed()
}

watch(() => route.path, closeDrawer)

async function logout() {
    if (!user.value) return
    clearUser()
    try {
        await api.auth.logout()
    } catch (error) {
        console.error('Logout request failed', error.message)
    }
}
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
