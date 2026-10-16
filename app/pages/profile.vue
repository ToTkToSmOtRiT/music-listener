<template>
    <section class="page profile">
        <header class="page__head">
            <h1>Profile</h1>
            <p>Your account, your settings and the music folder on this computer.</p>
        </header>

        <div v-if="!user" class="profile__empty">
            <p>Log in to see your profile.</p>
            <button type="button" class="btn btn--solid" @click="openAuth(true)">Log in</button>
        </div>

        <template v-else>
            <div class="profile__tabs" role="tablist">
                <button v-for="t in tabs" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id"
                    :class="{ on: tab === t.id }" @click="selectTab(t.id)">{{ t.label }}</button>
            </div>

            <!-- Account info -->
            <section v-if="tab === 'account'" class="account" aria-label="Account info">
                <p v-if="status === 'loading'" class="profile__note">Loading…</p>
                <p v-else-if="status === 'error'" class="profile__note">Could not load your account.</p>
                <template v-else-if="info">
                    <div class="account__card">
                        <span class="account__avatar">{{ info.username.charAt(0).toUpperCase() }}</span>
                        <div>
                            <h2>{{ info.username }}</h2>
                            <p>{{ info.email }}</p>
                            <p class="account__since">Member since {{ since }}</p>
                        </div>
                    </div>

                    <ul class="account__stats">
                        <li>
                            <NuxtLink to="/playlists/saved"><strong>{{ info.stats.saved }}</strong><span>Saved</span></NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/playlists/liked"><strong>{{ info.stats.liked }}</strong><span>Liked</span></NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/playlists"><strong>{{ info.stats.playlists }}</strong><span>Playlists</span></NuxtLink>
                        </li>
                        <li>
                            <div><strong>{{ info.stats.comments }}</strong><span>Comments</span></div>
                        </li>
                    </ul>

                    <button type="button" class="btn btn--ghost" @click="logout">Log out</button>
                </template>
            </section>

            <!-- Settings -->
            <section v-else-if="tab === 'settings'" class="settings" aria-label="Settings">
                <div class="settings__block">
                    <h2>Appearance</h2>
                    <p>Choose how the site looks. It is remembered on this device.</p>
                    <div class="settings__themes" role="group" aria-label="Colour theme">
                        <button v-for="o in themes" :key="o.id" type="button" :aria-pressed="theme === o.id"
                            :class="{ on: theme === o.id }" @click="theme = o.id">
                            <span class="settings__swatch" :class="`settings__swatch--${o.id}`" aria-hidden="true">
                                <i /><i /><i />
                            </span>
                            <strong>{{ o.label }}</strong>
                            <small>{{ o.text }}</small>
                        </button>
                    </div>
                </div>

                <div class="settings__block">
                    <h2>Listen feed</h2>
                    <p>
                        "For you" learns from what you play to the end, skip, like, save and add to playlists. It all
                        stays on this server.
                    </p>
                    <ForYouPanel />
                </div>
            </section>

            <!-- Local: the music folder (unchanged) -->
            <LocalLibrary v-else-if="tab === 'local'" />
        </template>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
const route = useRoute()
const router = useRouter()
const theme = useTheme()
const logout = useLogout()
useHead({ title: 'Profile - Music listener' })

const tabs = [
    { id: 'account', label: 'Account info' },
    { id: 'settings', label: 'Settings' },
    { id: 'local', label: 'Local' },
]
const themes = [
    { id: 'ivory', label: 'Ivory', text: 'Light, warm and calm' },
    { id: 'ebony', label: 'Ebony', text: 'Dark, with gold accents' },
]

// /profile?tab=local opens the Local tab directly
const tab = ref(tabs.some((t) => t.id === route.query.tab) ? route.query.tab : 'account')
function selectTab(id) {
    tab.value = id
    router.replace({ query: id === 'account' ? {} : { tab: id } })
}

const info = ref(null)
const status = ref('loading')
const since = computed(() => (info.value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(info.value.createdAt * 1000))
    : ''))

async function load() {
    if (!user.value) return
    status.value = 'loading'
    try {
        info.value = await api.account()
        status.value = 'ready'
    } catch (error) {
        status.value = 'error'
    }
}

onMounted(load)
watch(user, load)
</script>

<style lang="scss">
.profile {
    &__tabs {
        display: inline-flex;
        margin-bottom: 26px;
        padding: 4px;
        border-radius: 999px;
        background: var(--bg-sunk);

        button {
            padding: 7px 22px;
            border: 0;
            border-radius: 999px;
            background: transparent;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-2);
            cursor: pointer;

            &.on {
                background: var(--ink);
                color: var(--ink-contrast);
            }
        }
    }

    &__empty,
    &__note {
        margin: 40px 0;
        color: var(--text-2);
    }

    &__empty p {
        margin: 0 0 14px;
    }
}

.account {
    max-width: 640px;

    &__card {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--bg-elev);

        h2 {
            font-size: 32px;
            overflow-wrap: anywhere;
        }

        p {
            margin: 2px 0 0;
            overflow-wrap: anywhere;
            color: var(--text-2);
        }
    }

    &__since {
        font-size: 13px;
        color: var(--text-3) !important;
    }

    &__avatar {
        display: grid;
        flex: none;
        place-items: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--accent);
        font-family: var(--font-display);
        font-size: 36px;
        font-weight: 600;
        color: var(--accent-ink);
    }

    &__stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin: 18px 0 24px;

        li > * {
            display: flex;
            flex-direction: column;
            padding: 14px 16px;
            border: 1px solid var(--line);
            border-radius: 14px;
            background: var(--bg-elev);
            text-decoration: none;
        }

        li > a:hover {
            border-color: var(--accent);
        }

        strong {
            font-family: var(--font-display);
            font-size: 30px;
            font-weight: 600;
            line-height: 1.1;
        }

        span {
            font-size: 13px;
            color: var(--text-2);
        }
    }
}

.settings {
    display: flex;
    flex-direction: column;
    gap: 22px;
    max-width: 640px;

    &__block {
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--bg-elev);

        h2 {
            font-size: 26px;
        }

        > p {
            margin: 4px 0 16px;
            font-size: 14px;
            color: var(--text-2);
        }
    }

    &__themes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;

        button {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 12px;
            border: 2px solid var(--line);
            border-radius: 14px;
            background: transparent;
            text-align: left;
            cursor: pointer;
            transition: border-color 0.2s;

            &:hover {
                border-color: var(--line-strong);
            }

            &.on {
                border-color: var(--accent);
            }

            small {
                font-size: 12px;
                color: var(--text-2);
            }
        }
    }

    // a tiny preview of each theme
    &__swatch {
        display: flex;
        gap: 4px;
        width: 100%;
        margin-bottom: 8px;
        padding: 10px;
        border-radius: 8px;

        i {
            flex: 1;
            height: 22px;
            border-radius: 4px;
        }

        &--ivory {
            background: #faf7f2;

            i:nth-child(1) { background: #1c1b19; }
            i:nth-child(2) { background: #efe9de; }
            i:nth-child(3) { background: #9a7b2f; }
        }

        &--ebony {
            background: #121212;

            i:nth-child(1) { background: #f2ede4; }
            i:nth-child(2) { background: #262626; }
            i:nth-child(3) { background: #d7b866; }
        }
    }
}
</style>
