<template>
    <section class="page collview">
        <NuxtLink to="/playlists" class="collview__back">&larr; Playlists</NuxtLink>

        <header class="page__head">
            <h1>{{ meta.title }}</h1>
            <p>{{ meta.text }}</p>
        </header>

        <div v-if="items.some((t) => t.available)" class="collview__bar">
            <NuxtLink :to="{ path: '/listener', query: { source: kind } }" class="btn btn--solid">
                <AppIcon name="play" :size="16" /> Play all
            </NuxtLink>
            <span class="collview__count">{{ items.length }} {{ items.length === 1 ? 'track' : 'tracks' }}</span>
        </div>

        <p v-if="status === 'loading'" class="collview__note">Loading…</p>
        <p v-else-if="status === 'error'" class="collview__note">Could not load this list.</p>
        <p v-else-if="!items.length" class="collview__note">
            Nothing here yet. Use {{ kind === 'saved' ? 'Save' : 'the heart' }} on the listening page, or the Playlist
            button's list.
        </p>

        <ul v-else class="collview__grid">
            <li v-for="t in items" :key="t.id" class="tile" :class="{ 'tile--off': !t.available }">
                <!-- an unavailable track links back to this page, so clicking it does nothing -->
                <NuxtLink :to="t.available ? { path: '/listener', query: { source: kind, track: t.id } } : { path: route.path }"
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
                <button type="button" class="tile__add" :aria-label="`Add ${t.title} to a playlist`" title="Add to a playlist"
                    @click="pickerTrack = t.id">
                    <AppIcon name="list-add" :size="18" />
                </button>
                <button type="button" class="tile__remove" :aria-label="`Remove ${t.title} from ${meta.title}`"
                    :title="`Remove from ${meta.title}`" @click="remove(t)">
                    <AppIcon name="close" :size="16" />
                </button>
            </li>
        </ul>

        <PlaylistPicker :open="pickerTrack !== null" :track-id="pickerTrack" @close="pickerTrack = null" />
    </section>
</template>

<script setup>
// "Saved" and "Liked": the two built-in lists that sit on top of the user's playlists.
const props = defineProps({ kind: { type: String, required: true } }) // 'saved' | 'liked'

const api = useApi()
const route = useRoute()
const items = ref([])
const status = ref('loading')
const pickerTrack = ref(null)

const meta = computed(() => (props.kind === 'saved'
    ? { title: 'Saved', text: 'Tracks you saved. Opening one plays through the whole list.', flag: 'favourite' }
    : { title: 'Liked', text: 'Tracks you liked. Opening one plays through the whole list.', flag: 'like' }))

async function load() {
    status.value = 'loading'
    try {
        items.value = (await api.collection(props.kind)).items
        status.value = 'ready'
    } catch (error) {
        status.value = 'error'
    }
}

// Taking a track out of the list is un-saving or un-liking it.
async function remove(track) {
    const at = items.value.indexOf(track)
    items.value.splice(at, 1)
    try {
        await api.tracks.setFlag(track.id, meta.value.flag, false)
    } catch (error) {
        items.value.splice(at, 0, track)
    }
}

function tileStyle(id) {
    const hue = (Math.abs(id) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}

onMounted(load)
watch(() => props.kind, load)
</script>

<style lang="scss">
.collview {
    &__back {
        display: inline-block;
        margin-bottom: 14px;
        font-size: 14px;
        text-decoration: none;
        color: var(--text-2);

        &:hover {
            color: var(--text);
        }
    }

    &__bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px;
        margin-bottom: 22px;
    }

    &__count {
        font-size: 14px;
        color: var(--text-2);
    }

    &__note {
        margin: 40px 0;
        color: var(--text-2);
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
        position: relative;
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

    &__add,
    &__remove {
        position: absolute;
        top: 8px;
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

    &__add {
        right: 8px;
    }

    &__remove {
        left: 8px;
    }

    // Always visible on touch screens, which have no hover.
    &:hover &__add,
    &:hover &__remove,
    &__add:focus-visible,
    &__remove:focus-visible {
        opacity: 1;
    }

    @media (hover: none) {
        &__add,
        &__remove {
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
