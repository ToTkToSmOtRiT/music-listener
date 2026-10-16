<template>
    <Teleport to="body">
        <Transition name="picker" :duration="200">
            <div v-if="artistKey" class="picker-backdrop" @mousedown.self="emit('close')">
                <div class="artist" role="dialog" aria-modal="true" :aria-labelledby="titleId">
                    <button type="button" class="picker__close" aria-label="Close" @click="emit('close')">&times;</button>

                    <p v-if="status === 'loading'" class="artist__note">Loading…</p>
                    <p v-else-if="status === 'error'" class="artist__note">Could not load this artist.</p>

                    <template v-else-if="artist">
                        <header class="artist__head">
                            <h2 :id="titleId">{{ artist.name }}</h2>
                            <p class="artist__meta">
                                {{ artist.tracks.length }} {{ artist.tracks.length === 1 ? 'track' : 'tracks' }}
                                <template v-if="artist.genres.length"> &middot; {{ artist.genres.map((g) => g.label).join(', ') }}</template>
                            </p>
                            <NuxtLink :to="{ path: '/listener', query: { source: `artist:${artist.key}` } }"
                                class="btn btn--solid">
                                <AppIcon name="play" :size="16" /> Play all
                            </NuxtLink>
                        </header>

                        <ul class="artist__list">
                            <li v-for="t in artist.tracks" :key="t.id">
                                <NuxtLink :to="{ path: '/listener', query: { source: `artist:${artist.key}`, track: t.id } }"
                                    class="artist__track">
                                    <span class="artist__art" :style="t.hasCover ? null : tileStyle(t.id)">
                                        <img v-if="t.hasCover" :src="`/api/tracks/${t.id}/cover`" alt="" loading="lazy">
                                        <AppIcon v-else name="listen" :size="16" />
                                    </span>
                                    <span class="artist__title">{{ t.title }}</span>
                                </NuxtLink>
                                <button type="button" class="artist__add" :aria-label="`Add ${t.title} to a playlist`"
                                    title="Add to playlist" @click="pickerTrack = t.id">
                                    <AppIcon name="list-add" :size="18" />
                                </button>
                            </li>
                        </ul>
                    </template>
                </div>
            </div>
        </Transition>
    </Teleport>
    <PlaylistPicker :open="pickerTrack !== null" :track-id="pickerTrack" @close="pickerTrack = null" />
</template>

<script setup>
const props = defineProps({ artistKey: { type: String, default: null } })
const emit = defineEmits(['close'])

const api = useApi()
const titleId = useId()
const artist = ref(null)
const status = ref('loading')
const pickerTrack = ref(null)

let requestId = 0
async function load(key) {
    const mine = ++requestId
    artist.value = null
    if (!key) return
    status.value = 'loading'
    try {
        const data = await api.artists.get(key)
        if (mine === requestId) {
            artist.value = data
            status.value = 'ready'
        }
    } catch (error) {
        if (mine === requestId) status.value = 'error'
    }
}
watch(() => props.artistKey, load, { immediate: true })

function onKey(event) {
    if (event.key === 'Escape' && pickerTrack.value === null) emit('close')
}
watch(() => props.artistKey, (key) => {
    if (key) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function tileStyle(id) {
    const hue = (Math.abs(id) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}
</script>

<style lang="scss">
.artist {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 520px;
    max-height: 86dvh;
    padding: 28px 24px 18px;
    border: 1px solid var(--line-strong);
    border-radius: 18px;
    background: var(--bg-elev);
    color: var(--text);
    box-shadow: var(--shadow);
    text-align: left;

    &__note {
        margin: 20px 0;
        color: var(--text-2);
    }

    &__head {
        margin-bottom: 14px;
        padding-right: 28px;

        h2 {
            font-size: clamp(28px, 5vw, 36px);
            overflow-wrap: anywhere;
        }
    }

    &__meta {
        margin: 4px 0 14px;
        font-size: 14px;
        color: var(--text-2);
    }

    &__list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        border-top: 1px solid var(--line);

        li {
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid var(--line);
        }
    }

    &__track {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 9px 6px;
        text-decoration: none;

        &:hover .artist__title {
            color: var(--accent);
        }
    }

    &__art {
        display: grid;
        flex: none;
        place-items: center;
        width: 40px;
        height: 40px;
        overflow: hidden;
        border-radius: 8px;
        background: var(--bg-sunk);
        color: var(--tile-ink);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    &__title {
        overflow: hidden;
        font-size: 15px;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.15s;
    }

    &__add {
        display: grid;
        flex: none;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--text-2);
        cursor: pointer;

        &:hover {
            background: var(--bg-sunk);
            color: var(--text);
        }
    }
}
</style>
