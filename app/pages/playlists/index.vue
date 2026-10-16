<template>
    <section class="page plists">
        <header class="page__head">
            <h1>Playlists</h1>
            <p>Your own collections of tracks, in the order you choose.</p>
        </header>

        <div v-if="!user" class="plists__empty">
            <p>Log in to create and play your playlists.</p>
            <button type="button" class="btn btn--solid" @click="openAuth(true)">Log in</button>
        </div>

        <template v-else>
            <form class="plists__new" @submit.prevent="create">
                <input v-model="newName" type="text" maxlength="80" placeholder="Name a new playlist"
                    aria-label="New playlist name">
                <button type="submit" class="btn btn--solid" :disabled="!newName.trim() || creating">
                    <AppIcon name="plus" :size="16" /> Create
                </button>
            </form>
            <p v-if="error" class="plists__error" role="alert">{{ error }}</p>

            <p v-if="status === 'loading'" class="plists__note">Loading…</p>
            <p v-else-if="status === 'error'" class="plists__note">Could not load your playlists.</p>

            <ul v-else class="plists__grid">
                <!-- Saved and Liked are pinned on top of the user's own playlists -->
                <li v-for="s in special" :key="s.key">
                    <NuxtLink :to="`/playlists/${s.key}`" class="plist plist--pinned">
                        <span class="plist__art plist__art--pinned">
                            <AppIcon :name="s.key === 'saved' ? 'star' : 'heart'" :size="44" />
                        </span>
                        <strong>{{ s.name }}</strong>
                        <small>{{ s.count }} {{ s.count === 1 ? 'track' : 'tracks' }}</small>
                    </NuxtLink>
                </li>
                <li v-for="p in lists" :key="p.id">
                    <NuxtLink :to="`/playlists/${p.id}`" class="plist">
                        <span class="plist__art" :style="p.coverTrackId ? null : tileStyle(p.id)">
                            <img v-if="p.coverTrackId" :src="`/api/tracks/${p.coverTrackId}/cover`" alt="" loading="lazy">
                            <AppIcon v-else name="playlist" :size="34" />
                        </span>
                        <strong>{{ p.name }}</strong>
                        <small>{{ p.count }} {{ p.count === 1 ? 'track' : 'tracks' }}</small>
                    </NuxtLink>
                </li>
            </ul>
            <p v-if="status === 'ready' && !lists.length" class="plists__note">
                You have no playlists of your own yet. Create one above, or use the Playlist button on the listening page.
            </p>
        </template>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
const router = useRouter()
useHead({ title: 'Playlists - Music listener' })

const lists = ref([])
const special = ref([]) // Saved and Liked
const status = ref('loading')
const newName = ref('')
const creating = ref(false)
const error = ref('')

async function load() {
    if (!user.value) return
    status.value = 'loading'
    try {
        const [own, pinned] = await Promise.all([api.playlists.list(), api.playlists.special()])
        lists.value = own
        special.value = pinned
        status.value = 'ready'
    } catch (e) {
        status.value = 'error'
    }
}

async function create() {
    const name = newName.value.trim()
    if (!name || creating.value) return
    creating.value = true
    error.value = ''
    try {
        const made = await api.playlists.create(name)
        router.push(`/playlists/${made.id}`)
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not create the playlist.'
    } finally {
        creating.value = false
    }
}

function tileStyle(id) {
    const hue = (Math.abs(id) * 61 + 200) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}

onMounted(load)
watch(user, load)
</script>

<style lang="scss">
.plists {
    &__new {
        display: flex;
        gap: 10px;
        max-width: 480px;
        margin-bottom: 26px;

        input {
            flex: 1;
            min-width: 0;
            padding: 10px 16px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            outline: none;
            background: var(--bg-elev);
            color: var(--text);

            &::placeholder {
                color: var(--text-3);
            }

            &:focus {
                border-color: var(--accent);
            }
        }

        .btn:disabled {
            opacity: 0.4;
            cursor: default;
        }
    }

    &__empty,
    &__note {
        margin: 30px 0;
        color: var(--text-2);
    }

    &__empty p {
        margin: 0 0 14px;
    }

    &__error {
        margin: -14px 0 18px;
        font-size: 14px;
        color: var(--danger);
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 24px 18px;
    }
}

.plist {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-decoration: none;

    &__art {
        display: grid;
        place-items: center;
        aspect-ratio: 1;
        margin-bottom: 8px;
        overflow: hidden;
        border-radius: 14px;
        background: var(--bg-sunk);
        color: var(--tile-ink);
        transition: transform 0.2s, box-shadow 0.2s;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    &:hover &__art {
        transform: translateY(-3px);
        box-shadow: var(--shadow);
    }

    // Saved and Liked: the same card, in gold, so they read as the built-in lists
    &__art--pinned {
        border: 1px solid var(--accent);
        color: var(--accent);
    }

    strong {
        overflow: hidden;
        font-size: 16px;
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
    }

    small {
        font-size: 13px;
        color: var(--text-2);
    }
}
</style>
