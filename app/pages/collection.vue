<template>
    <section class="page collection">
        <header class="page__head">
            <h1>My collection</h1>
            <p>Your saved and liked tracks, and the music folder on this computer.</p>
        </header>

        <div v-if="!user" class="collection__empty">
            <p>Log in to see your saved and liked tracks.</p>
            <button type="button" class="btn btn--solid" @click="openAuth(true)">Log in</button>
        </div>

        <template v-else>
            <div class="collection__bar">
                <div class="collection__tabs" role="tablist">
                    <button v-for="t in tabs" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id"
                        :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
                </div>
                <NuxtLink v-if="tab !== 'local' && items.some((t) => t.available)" :to="{ path: '/listener', query: { source: tab } }"
                    class="btn btn--solid">
                    <AppIcon name="play" :size="16" /> Play all
                </NuxtLink>
            </div>

            <LocalLibrary v-if="tab === 'local'" />

            <p v-else-if="status === 'loading'" class="collection__note">Loading…</p>
            <p v-else-if="status === 'error'" class="collection__note">Could not load your collection.</p>
            <p v-else-if="!items.length" class="collection__note">
                Nothing here yet. Use {{ tab === 'saved' ? 'Save' : 'the heart' }} on the listening page.
            </p>

            <ul v-else class="collection__grid">
                <li v-for="t in items" :key="t.id" class="tile" :class="{ 'tile--off': !t.available }">
                    <!-- an unavailable track links back to this page, so clicking it does nothing -->
                    <NuxtLink :to="t.available ? { path: '/listener', query: { source: tab, track: t.id } } : { path: route.path, query: route.query }"
                        class="tile__link"
                        :title="t.available ? undefined : 'This track is in a music folder that is not selected now'">
                        <span class="tile__art" :style="t.hasCover ? null : tileStyle(t.id)">
                            <img v-if="t.hasCover" :src="`/api/tracks/${t.id}/cover`" alt="" loading="lazy">
                            <AppIcon v-else name="listen" :size="30" />
                            <em v-if="!t.available" class="tile__off">Unavailable</em>
                        </span>
                        <strong>{{ t.title }}</strong>
                        <small>{{ t.artist }}</small>
                    </NuxtLink>
                    <button type="button" class="tile__add" :aria-label="`Add ${t.title} to a playlist`"
                        title="Add to playlist" @click="pickerTrack = t.id">
                        <AppIcon name="list-add" :size="18" />
                    </button>
                </li>
            </ul>
        </template>

        <PlaylistPicker :open="pickerTrack !== null" :track-id="pickerTrack" @close="pickerTrack = null" />
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
useHead({ title: 'My collection - Music listener' })

const tabs = [
    { id: 'saved', label: 'Saved' },
    { id: 'liked', label: 'Liked' },
    { id: 'local', label: 'Local' },
]
const route = useRoute()
// /collection?tab=local opens the Local tab directly
const tab = ref(tabs.some((t) => t.id === route.query.tab) ? route.query.tab : 'saved')
const items = ref([])
const status = ref('loading')
const pickerTrack = ref(null)

let requestId = 0
async function load() {
    if (!user.value || tab.value === 'local') return
    const mine = ++requestId
    status.value = 'loading'
    try {
        const res = await api.collection(tab.value)
        if (mine !== requestId) return
        items.value = res.items
        status.value = 'ready'
    } catch (error) {
        if (mine === requestId) status.value = 'error'
    }
}

// Same colour recipe as the player's placeholder tile.
function tileStyle(id) {
    const hue = (Math.abs(id) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}

onMounted(load)
watch([tab, user], load)
</script>

<style lang="scss">
.collection {
    &__bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 22px;
    }

    &__tabs {
        display: inline-flex;
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

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 22px 18px;
    }
}

.tile {
    position: relative;

    &__link {
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-decoration: none;
    }

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

    &__link:hover &__art {
        transform: translateY(-3px);
        box-shadow: var(--shadow);
    }

    // A track from a music folder that is not the selected one: shown, but it cannot play.
    &--off &__art,
    &--off strong,
    &--off small {
        opacity: 0.45;
    }

    &--off &__link {
        cursor: not-allowed;
    }

    &__art {
        position: relative;
    }

    &__off {
        position: absolute;
        left: 8px;
        bottom: 8px;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.7);
        font-size: 11px;
        font-style: normal;
        color: #fff;
    }

    &__add {
        position: absolute;
        top: 8px;
        right: 8px;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 1px solid var(--glass-line);
        border-radius: 50%;
        background: var(--glass);
        backdrop-filter: blur(8px);
        color: var(--text);
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s, transform 0.15s;

        &:hover {
            transform: scale(1.08);
        }
    }

    // Always visible on touch screens, which have no hover.
    &:hover &__add,
    &__add:focus-visible {
        opacity: 1;
    }

    @media (hover: none) {
        &__add {
            opacity: 1;
        }
    }

    strong {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.25;
        overflow-wrap: anywhere;
        color: var(--text);
    }

    small {
        font-size: 13px;
        color: var(--text-2);
    }
}
</style>
