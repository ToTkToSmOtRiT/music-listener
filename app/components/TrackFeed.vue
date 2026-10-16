<template>
    <section class="feed">
        <CoverBackdrop :src="coverUrl" :seed="current?.id ?? 0" />

        <div class="feed__layout">
            <div class="stage" @pointerdown="onDown" @pointerup="onUp" @pointercancel="tracking = false"
                @wheel="onWheel">
                <p v-if="!current" class="stage__msg">
                    {{ status === 'error' ? 'Could not load tracks. Is the server running?' : status === 'empty' ? 'No tracks yet.' : 'Loading…' }}
                </p>

                <div v-else :key="current.id" class="slide" :class="`slide--${direction}`">
                    <div class="slide__cover" role="button" tabindex="0" :aria-label="isPlaying ? 'Pause' : 'Play'"
                        @keydown.enter="togglePlay">
                        <img v-if="coverUrl" :src="coverUrl" alt="" draggable="false" @error="onCoverError">
                        <div v-else class="slide__placeholder" :style="placeholderStyle">
                            <svg viewBox="0 0 24 24" width="35%" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" /></svg>
                        </div>
                        <span v-if="!isPlaying" class="slide__big-play" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </span>
                    </div>

                    <h2 class="slide__title">{{ current.title }}</h2>
                    <p class="slide__artist">{{ current.artist }}</p>
                    <p v-if="current.genres?.length" class="slide__genres">
                        <button v-for="g in current.genres" :key="g.slug" type="button" :title="`Browse ${g.label}`"
                            @click="openGenre(g.slug)">{{ g.label }}</button>
                    </p>

                    <div class="seekbar">
                        <span>{{ fmt(currentTime) }}</span>
                        <input type="range" min="0" :max="duration || 0" step="0.1" :value="currentTime"
                            :style="{ '--pct': `${pct}%` }" aria-label="Seek" @input="seek">
                        <span>{{ fmt(duration) }}</span>
                    </div>

                    <div class="controls">
                        <button type="button" aria-label="Previous track" @click="go(-1)">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                        </button>
                        <button type="button" class="controls__play" :aria-label="isPlaying ? 'Pause' : 'Play'"
                            @click="togglePlay">
                            <svg v-if="!isPlaying" viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            <svg v-else viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
                        </button>
                        <button type="button" aria-label="Next track" @click="go(1)">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>
                        </button>
                    </div>
                </div>

                <div v-if="current" class="rail">
                    <button type="button" class="rail__btn" :class="{ on: current.liked }" :aria-pressed="current.liked"
                        aria-label="Like" @click="toggleFlag('like')">
                        <svg viewBox="0 0 24 24" width="26" height="26" :fill="current.liked ? 'currentColor' : 'none'"
                            stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 2.8 4.5 6.5 4.5c2 0 3.6 1.1 5.5 3.2 1.9-2.1 3.5-3.2 5.5-3.2 3.7 0 5.6 3.8 4.1 7.3C19.5 16.4 12 21 12 21z" /></svg>
                        <span>{{ current.likes }}</span>
                    </button>
                    <button type="button" class="rail__btn rail__btn--comments" aria-label="Open comments"
                        @click="openComments">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></svg>
                        <span>{{ current.comments }}</span>
                    </button>
                    <button type="button" class="rail__btn" :class="{ on: current.favourited }"
                        :aria-pressed="current.favourited" aria-label="Add to favourites"
                        @click="toggleFlag('favourite')">
                        <svg viewBox="0 0 24 24" width="26" height="26" :fill="current.favourited ? 'currentColor' : 'none'"
                            stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4 6.3 20.5l1.2-6.4L2.8 9.7l6.4-.8z" /></svg>
                        <span>Save</span>
                    </button>
                    <button type="button" class="rail__btn" aria-label="Add to playlist" @click="openPicker">
                        <AppIcon name="list-add" :size="26" />
                        <span>Playlist</span>
                    </button>
                    <button type="button" class="rail__btn" aria-label="Share" @click="share">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
                        <span>Share</span>
                    </button>
                </div>

                <VolumeControl v-model="volume" v-model:muted="muted" class="stage__vol" />
                <p v-if="current && sourceLabel" class="stage__hint stage__hint--source">
                    Playing from {{ sourceLabel }} &middot; {{ index + 1 }} of {{ tracks.length }}
                </p>
                <p v-else-if="current && genreLabel" class="stage__hint stage__hint--source">
                    Shuffling {{ genreLabel }}
                </p>
                <p v-else-if="current && hint" class="stage__hint">Swipe up or down to change the track</p>
            </div>

            <CommentsPanel v-if="current" :key="current.id" ref="panel" :track-id="current.id" :count="current.comments"
                :open="commentsOpen" @close="commentsOpen = false" @added="current.comments += 1" />
        </div>

        <PlaylistPicker :open="pickerOpen" :track-id="current?.id ?? null" @close="pickerOpen = false" />

        <div v-if="commentsOpen" class="feed__dim" @click="commentsOpen = false" />
        <p v-if="toast" class="feed__toast" role="status">{{ toast }}</p>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
const route = useRoute()
const router = useRouter()

const tracks = ref([])
const index = ref(0)
const status = ref('loading') // loading | ready | empty | error
const direction = ref('next')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const muted = ref(false)
const commentsOpen = ref(false)
const toast = ref('')
const hint = ref(true)
const panel = ref(null)
const pickerOpen = ref(false)
const sourceLabel = ref('') // e.g. "Saved" or a playlist name; empty for the shuffled feed
const genreLabel = ref('') // set when the shuffled feed is limited to one genre (from the Library)

const current = computed(() => tracks.value[index.value] ?? null)
const coverUrl = computed(() => (current.value?.hasCover ? `/api/tracks/${current.value.id}/cover` : ''))
// Same hue as the CoverBackdrop gradient, so the tile and the background match.
const placeholderStyle = computed(() => {
    const hue = (Math.abs(current.value?.id ?? 0) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
})
const pct = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0))

// --- feed loading ---------------------------------------------------------

const PAGE = 10
let seed = 1
let offset = 0
let total = 0
let loadingMore = false

async function loadMore() {
    if (loadingMore || (total && offset >= total)) return
    loadingMore = true
    try {
        const res = await api.tracks.page({ limit: PAGE, offset, seed, genre: genre || undefined })
        total = res.total
        offset += PAGE
        genreLabel.value = res.label ?? ''
        const known = new Set(tracks.value.map((t) => t.id))
        tracks.value.push(...res.items.filter((t) => !known.has(t.id)))
    } finally {
        loadingMore = false
    }
}

// '' = the shuffled feed (the Listen tab); otherwise 'saved', 'liked', 'playlist:ID' or 'artist:name',
// played in that list's order. A genre (from the Library's "Play genre") limits the shuffled feed.
let source = ''
let genre = ''
const querySource = () => (typeof route.query.source === 'string' ? route.query.source : '')
const queryGenre = () => (typeof route.query.genre === 'string' ? route.query.genre : '')

// Genres are browsed in the Library: a genre tag on a track opens that genre there.
function openGenre(slug) {
    navigateTo({ path: '/library', query: { genre: slug } })
}

async function init() {
    source = querySource()
    genre = queryGenre()
    sourceLabel.value = ''
    genreLabel.value = ''
    seed = Math.floor(Math.random() * 1e9) + 1
    offset = 0
    total = 0
    tracks.value = []
    index.value = 0
    status.value = 'loading'
    try {
        const wanted = Number(route.query.track)
        const hasWanted = Boolean(route.query.track) && Number.isInteger(wanted)

        if (source) {
            try {
                // Lists are small, so the whole list is loaded and the player starts at the chosen track.
                const res = await api.tracks.page({ source, limit: 200, offset: 0 })
                tracks.value = res.items
                total = res.total
                offset = res.total
                sourceLabel.value = res.label
                const at = hasWanted ? res.items.findIndex((t) => t.id === wanted) : -1
                index.value = at >= 0 ? at : 0
                wantPlay.value = true // opened from a list: keep playing through it
            } catch (error) {
                const code = error.statusCode ?? error.status
                showToast(code === 401 ? 'Log in to play your lists' : 'That list is not available')
                source = ''
                tracks.value = []
            }
        }

        if (!source) {
            if (hasWanted) {
                const { items } = await api.tracks.byIds([wanted])
                tracks.value.push(...items)
            }
            try {
                await loadMore()
            } catch (error) {
                if (!genre || (error.statusCode ?? error.status) !== 404) throw error
                showToast('That genre does not exist')
                genre = ''
                await loadMore()
            }
        }
        status.value = tracks.value.length ? 'ready' : 'empty'
    } catch (error) {
        status.value = 'error'
    }
}

// The menu's "Listen" link, or a link from the Library or a list, can change the source or genre
// while this page stays mounted.
watch(() => [route.query.source, route.query.genre], () => {
    if (querySource() !== source || queryGenre() !== genre) init()
})

function go(step) {
    const n = tracks.value.length
    if (!n) return
    let next = index.value + step
    if (next < 0) return showToast('This is where your feed starts')
    if (next >= n) next = 0 // end of the feed or list: start over
    direction.value = step > 0 ? 'next' : 'prev'
    index.value = next
    hint.value = false
    if (next >= n - 3) loadMore()
}

// --- audio ----------------------------------------------------------------

let audio = null
let failures = 0
const wantPlay = ref(false) // once the user has pressed play, later tracks start by themselves

function ensureAudio() {
    if (audio) return audio
    const a = new Audio()
    a.preload = 'auto'
    audio = a
    // Handlers use their own element and ignore it once it has been discarded:
    // tearing down the player makes the element fire a few late events.
    const live = (fn) => () => { if (audio === a) fn() }
    a.addEventListener('timeupdate', live(() => { currentTime.value = a.currentTime }))
    a.addEventListener('durationchange', live(() => { duration.value = Number.isFinite(a.duration) ? a.duration : 0 }))
    a.addEventListener('play', live(() => { isPlaying.value = true }))
    a.addEventListener('pause', live(() => { isPlaying.value = false }))
    a.addEventListener('playing', live(() => { failures = 0 }))
    a.addEventListener('ended', live(() => go(1)))
    a.addEventListener('error', live(() => {
        if (!a.getAttribute('src')) return
        showToast('Could not play this track')
        if (wantPlay.value && ++failures < 3) setTimeout(() => { if (audio === a) go(1) }, 900)
    }))
    applyVolume()
    return a
}

function loadAudio(autoplay) {
    const a = ensureAudio()
    a.src = `/api/tracks/${current.value.id}/audio`
    currentTime.value = 0
    duration.value = 0
    if (autoplay) a.play().catch(() => {})
}

function togglePlay() {
    const a = ensureAudio()
    if (!a.src && current.value) loadAudio(false)
    if (a.paused) {
        wantPlay.value = true
        a.play().catch(() => showToast('Press play to start'))
    } else {
        wantPlay.value = false
        a.pause()
    }
}

function seek(event) {
    if (audio) audio.currentTime = Number(event.target.value)
}

function applyVolume() {
    if (audio) audio.volume = muted.value ? 0 : volume.value
}
watch([volume, muted], () => {
    applyVolume()
    try {
        localStorage.setItem('player', JSON.stringify({ volume: volume.value, muted: muted.value }))
    } catch (error) { /* storage unavailable */ }
})

function fmt(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function updateMediaSession() {
    if (!('mediaSession' in navigator) || !current.value) return
    const t = current.value
    navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        artwork: coverUrl.value ? [{ src: coverUrl.value }] : []
    })
}

watch(() => current.value?.id, (id) => {
    if (id == null) return
    loadAudio(wantPlay.value)
    updateMediaSession()
    const query = { ...route.query, track: id }
    if (!source) delete query.source
    if (!genre || source) delete query.genre
    router.replace({ query })
    const upcoming = tracks.value[index.value + 1]
    if (upcoming?.hasCover) new Image().src = `/api/tracks/${upcoming.id}/cover` // warm the next background
})

function onCoverError() {
    if (current.value) current.value.hasCover = false
}

// --- gestures: swipe, wheel, keyboard --------------------------------------

let tracking = false
let startX = 0
let startY = 0

function onDown(event) {
    if (event.target.closest('button, input, a, .vol')) return
    tracking = true
    startX = event.clientX
    startY = event.clientY
}
function onUp(event) {
    if (!tracking) return
    tracking = false
    const dy = startY - event.clientY
    const dx = startX - event.clientX
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) * 1.2) return go(dy > 0 ? 1 : -1)
    if (Math.abs(dy) < 8 && Math.abs(dx) < 8 && event.target.closest('.slide__cover')) togglePlay()
}

let wheelLock = 0
function onWheel(event) {
    event.preventDefault()
    const now = Date.now()
    if (now < wheelLock || Math.abs(event.deltaY) < 20) return
    wheelLock = now + 700
    go(event.deltaY > 0 ? 1 : -1)
}

function onKey(event) {
    if (pickerOpen.value) return
    const el = event.target instanceof Element ? event.target : document.body
    if (el.closest('input, textarea, [contenteditable]') || event.ctrlKey || event.metaKey || event.altKey) return
    const keys = { ArrowDown: () => go(1), j: () => go(1), ArrowUp: () => go(-1), k: () => go(-1), m: () => { muted.value = !muted.value } }
    if (event.key === ' ' && !el.closest('button')) {
        event.preventDefault()
        return togglePlay()
    }
    if (keys[event.key]) {
        event.preventDefault()
        keys[event.key]()
    }
}

// --- like, favourite, share, comments --------------------------------------

async function toggleFlag(kind) {
    const t = current.value
    if (!t) return
    if (!user.value) return openAuth(true)
    const key = kind === 'like' ? 'liked' : 'favourited'
    const was = t[key]
    t[key] = !was
    if (kind === 'like') t.likes += was ? -1 : 1
    try {
        await api.tracks.setFlag(t.id, kind, !was)
    } catch (error) {
        t[key] = was
        if (kind === 'like') t.likes += was ? 1 : -1
        showToast(error.data?.statusMessage || 'Something went wrong')
    }
}

async function share() {
    const t = current.value
    if (!t) return
    const url = `${location.origin}/listener?track=${t.id}`
    try {
        if (navigator.share) {
            await navigator.share({ title: `${t.title} - ${t.artist}`, text: 'Listen on Music listener', url })
        } else {
            await navigator.clipboard.writeText(url)
            showToast('Link copied to clipboard')
        }
    } catch (error) {
        if (error.name !== 'AbortError') showToast(url)
    }
}

function openPicker() {
    if (!user.value) return openAuth(true)
    pickerOpen.value = true
}

async function openComments() {
    commentsOpen.value = true
    await nextTick()
    panel.value?.focusInput()
}

let toastTimer
function showToast(message) {
    toast.value = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = '' }, 2400)
}

// Logging in or out changes which tracks are "liked by me".
watch(user, async () => {
    const ids = tracks.value.slice(index.value, index.value + 50).map((t) => t.id)
    if (!ids.length) return
    try {
        const { items } = await api.tracks.byIds(ids)
        for (const fresh of items) {
            const t = tracks.value.find((x) => x.id === fresh.id)
            if (t) Object.assign(t, { liked: fresh.liked, favourited: fresh.favourited, likes: fresh.likes })
        }
    } catch (error) { /* keep what we have */ }
})

onMounted(() => {
    try {
        const saved = JSON.parse(localStorage.getItem('player') || '{}')
        if (typeof saved.volume === 'number') volume.value = Math.min(Math.max(saved.volume, 0), 1)
        muted.value = Boolean(saved.muted)
    } catch (error) { /* storage unavailable */ }

    if ('mediaSession' in navigator) {
        const set = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn) } catch (e) { /* unsupported */ } }
        set('nexttrack', () => go(1))
        set('previoustrack', () => go(-1))
        set('play', () => togglePlay())
        set('pause', () => togglePlay())
    }
    window.addEventListener('keydown', onKey)
    init()
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    clearTimeout(toastTimer)
    if (audio) {
        const a = audio
        audio = null // detach first so the events below are ignored
        a.pause()
        a.removeAttribute('src')
        a.load()
    }
})
</script>

<style lang="scss">
.feed {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    color: var(--text);

    &__layout {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        flex: 1;
        min-height: 0;
        padding: 10px 12px;

        @media (min-width: 960px) {
            grid-template-columns: minmax(0, 1fr) 400px;
            gap: 24px;
            padding: 18px 24px;
        }
    }

    &__dim {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(0, 0, 0, 0.5);

        @media (min-width: 960px) {
            display: none;
        }
    }

    &__toast {
        position: fixed;
        bottom: 28px;
        left: 50%;
        z-index: 40;
        transform: translateX(-50%);
        max-width: 90vw;
        margin: 0;
        padding: 10px 18px;
        border-radius: 999px;
        background: var(--ink);
        font-size: 14px;
        color: var(--ink-contrast);
        overflow-wrap: anywhere;
    }
}

.stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding-bottom: 44px; // keeps the track clear of the volume control in the corner
    touch-action: none; // we handle vertical swipes ourselves
    user-select: none;
    -webkit-user-select: none;

    &__msg {
        margin: 0;
        font-size: 18px;
        color: var(--text-2);
    }

    &__vol {
        position: absolute;
        left: 4px;
        bottom: 4px;
    }

    &__hint {
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translateX(-50%);
        margin: 0;
        padding: 6px 14px;
        border: 1px solid var(--glass-line);
        border-radius: 999px;
        background: var(--glass);
        font-size: 12px;
        white-space: nowrap;
        color: var(--text-2);
        animation: hint-pulse 2.4s ease-in-out infinite;

        &--source {
            max-width: 90%;
            overflow: hidden;
            text-overflow: ellipsis;
            animation: none;
            color: var(--text);
        }
    }
}

.slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 480px;
    padding: 0 60px;
    animation: slide-in 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;

    &--prev {
        animation-name: slide-in-prev;
    }

    &__cover {
        position: relative;
        width: min(70vw, 32dvh, 380px);
        aspect-ratio: 1;
        margin-bottom: 10px;
        border-radius: 18px;
        overflow: hidden;
        background: var(--bg-sunk);
        box-shadow: var(--shadow);
        cursor: pointer;

        .slide__placeholder {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            color: var(--tile-ink);
        }

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
        }
    }

    &__big-play {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
    }

    &__title {
        margin: 0;
        max-width: 100%;
        font-size: clamp(24px, 3.4vw, 32px);
        line-height: 1.1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
    }

    &__artist {
        margin: 0;
        font-size: 15px;
        color: var(--text-2);
    }

    &__genres {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        margin: 2px 0 0;

        button {
            padding: 2px 10px;
            border: 1px solid var(--glass-line);
            border-radius: 999px;
            background: var(--glass);
            font-size: 12px;
            color: var(--text-2);
            cursor: pointer;
            transition: color 0.2s, border-color 0.2s;

            &:hover {
                border-color: var(--text-2);
                color: var(--text);
            }
        }
    }
}

.seekbar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-top: 8px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--text-2);

    input[type='range'] {
        flex: 1;
        min-width: 0;
        height: 3px;
        appearance: none;
        -webkit-appearance: none;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
        background: linear-gradient(to right, var(--progress) var(--pct, 0%), var(--line-strong) var(--pct, 0%));

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--text);
        }

        &::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border: 0;
            border-radius: 50%;
            background: var(--text);
        }
    }
}

.controls {
    display: flex;
    align-items: center;
    gap: 22px;
    margin-top: 6px;

    button {
        display: grid;
        place-items: center;
        border: 0;
        background: none;
        color: var(--text);
        cursor: pointer;
        opacity: 0.85;
        transition: transform 0.15s, opacity 0.15s;

        &:hover {
            opacity: 1;
            transform: scale(1.08);
        }
    }

    &__play {
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: var(--ink) !important;
        color: var(--ink-contrast) !important;
        opacity: 1 !important;
    }
}

.rail {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-height: 700px) {
        gap: 6px;

        .rail__btn {
            padding: 6px 0;
        }
    }

    &__btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        width: 52px;
        padding: 9px 0;
        border: 1px solid var(--glass-line);
        border-radius: 16px;
        background: var(--glass);
        backdrop-filter: blur(8px);
        color: var(--text);
        cursor: pointer;
        transition: background-color 0.2s, transform 0.15s, color 0.2s, border-color 0.2s;

        span {
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            color: var(--text-2);
        }

        &:hover {
            border-color: var(--text-2);
            transform: scale(1.05);
        }

        &.on {
            color: var(--like);

            &:nth-of-type(3) {
                color: var(--accent);
            }
        }

        &--comments {
            color: var(--accent);

            @media (min-width: 960px) {
                display: none; // the panel is always visible on wide screens
            }
        }
    }
}

@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateY(70px);
    }
}

@keyframes slide-in-prev {
    from {
        opacity: 0;
        transform: translateY(-70px);
    }
}

@keyframes hint-pulse {
    50% {
        opacity: 0.45;
    }
}

@media (prefers-reduced-motion: reduce) {
    .slide {
        animation: none;
    }
}

@media (max-width: 420px) {
    .slide {
        padding: 0 52px 0 4px;
    }
}
</style>
