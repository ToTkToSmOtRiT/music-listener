<template>
    <section class="feed">
        <CoverBackdrop :src="coverUrl" :seed="current?.id ?? 0" />

        <!-- The Listen tab: "For you" or plain random. Not shown while playing a list or a genre. -->
        <ListenBar v-if="plainFeed" :mode="mode" :enabled="foryouOn" :learning="learning" @update:mode="setMode"
            @settings-changed="onSettingsChanged" />

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
                    <p v-if="current.reason" class="slide__reason">{{ current.reason }}</p>
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
                        <!-- Shuffle only means something inside a list; in the feeds (random already) it is
                             shown but cannot be pressed, so the buttons stay in place -->
                        <button type="button" class="controls__mode" :class="{ on: shuffle && isList }"
                            :disabled="!isList" :aria-pressed="shuffle && isList"
                            :title="isList ? (shuffle ? 'Shuffle: on' : 'Shuffle: off') : 'Shuffle works inside a playlist'"
                            aria-label="Shuffle" @click="toggleShuffle">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                        </button>
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
                        <!-- Repeat: off, the whole list (playlist), or this one song -->
                        <button type="button" class="controls__mode" :class="{ on: repeat !== 'off' }"
                            :title="repeatLabel" :aria-label="repeatLabel" @click="cycleRepeat">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" /></svg>
                            <b v-if="repeat === 'one'" class="controls__one">1</b>
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
                    <div class="rail__menu">
                        <button type="button" class="rail__btn" :class="{ open: menuOpen }" aria-label="Add to a list"
                            aria-haspopup="dialog" :aria-expanded="menuOpen" data-pmenu-toggle @click="toggleMenu">
                            <AppIcon name="list-add" :size="26" />
                            <span>Playlist</span>
                        </button>
                        <PlaylistMenu :open="menuOpen" :track-id="current.id" @close="menuOpen = false" @flag="onFlag" />
                    </div>
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

        <div v-if="commentsOpen" class="feed__dim" @click="commentsOpen = false" />
        <p v-if="toast" class="feed__toast" role="status">{{ toast }}</p>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
const route = useRoute()
const router = useRouter()

// The audio, the queue, shuffle and repeat live in the shared player, so the music goes on (and the mini
// player takes over) when you leave this page. This page decides which tracks are in the queue.
const player = usePlayer()
const {
    tracks, index, current, direction, isPlaying, currentTime, duration, volume, muted,
    isList, shuffle, repeat, repeatLabel, toggleShuffle, cycleRepeat, togglePlay
} = player

const status = ref('loading') // loading | ready | empty | error
const commentsOpen = ref(false)
const toast = ref('')
const hint = ref(true)
const panel = ref(null)
const menuOpen = ref(false) // the dropdown behind the Playlist button
const sourceLabel = ref('') // e.g. "Saved" or a playlist name; empty for the shuffled feed
const genreLabel = ref('') // set when the shuffled feed is limited to one genre (from the Library)

// The Listen tab has two modes: "For you" (picked from what you play, skip and like) and "Random".
const mode = ref('foryou')
const foryouOn = ref(true) // the user's switch for "For you" (settings window)
const learning = ref(false) // true while it has seen too few plays to personalise
const plainFeed = ref(false) // the Listen tab itself, as opposed to a list or a genre
let feedKind = 'random' // what the current feed was loaded as: 'foryou' or 'random'

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
    if (loadingMore || (feedKind === 'random' && total && offset >= total)) return
    loadingMore = true
    try {
        let res
        if (feedKind === 'foryou') {
            // "For you" never runs out; what the page already holds is excluded so nothing repeats
            try {
                res = await api.foryou.page({ limit: PAGE, exclude: tracks.value.slice(-300).map((t) => t.id) })
                learning.value = res.learning
            } catch (error) {
                if ((error.statusCode ?? error.status) !== 409) throw error
                foryouOn.value = false // turned off from another tab or window: carry on with random
                feedKind = 'random'
            }
        }
        if (feedKind === 'random') {
            res = await api.tracks.page({ limit: PAGE, offset, seed, genre: genre || undefined })
            total = res.total
            offset += PAGE
            genreLabel.value = res.label ?? ''
        }
        const known = new Set(tracks.value.map((t) => t.id))
        tracks.value.push(...res.items.filter((t) => !known.has(t.id)))
        saveMeta()
    } finally {
        loadingMore = false
    }
}

// What the next visit to this page needs to carry on with the same feed.
function saveMeta() {
    player.meta.value = { seed, offset, total, feedKind, genreLabel: genreLabel.value }
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

// Switching between "For you" and "Random" starts a fresh feed.
function setMode(next) {
    if (next === mode.value) return
    mode.value = next
    try {
        localStorage.setItem('listenMode', next)
    } catch (error) { /* storage unavailable */ }
    // A new feed starts with a new track. The address holds the playing track (?track=...), which is
    // meant for shared links and page loads, so drop it or it would be put first again.
    const query = { ...route.query }
    delete query.track
    router.replace({ query })
    init({ fresh: true })
}

async function loadSettings() {
    try {
        const profile = await api.foryou.profile()
        foryouOn.value = profile.enabled
        learning.value = profile.learning
    } catch (error) { /* keep the defaults */ }
}

// The settings window turned "For you" on or off, or reset the profile. The track playing right now is
// not reported: after a reset nothing about the old listening should be written back.
async function onSettingsChanged() {
    player.discardPlay()
    await loadSettings()
    init()
}

// fresh: ignore ?track= in the address (see setMode) and start with whatever the feed picks
async function init({ fresh = false } = {}) {
    source = querySource()
    genre = queryGenre()
    const wanted = Number(route.query.track)
    const hasWanted = !fresh && Boolean(route.query.track) && Number.isInteger(wanted)

    // Coming back to the page while the same feed or list is playing: carry on, do not start over.
    const kindNow = !genre && mode.value === 'foryou' && foryouOn.value ? 'foryou' : 'random'
    const wantedKey = source || (genre ? `genre:${genre}` : `feed:${kindNow}`)
    const held = player.meta.value
    if (!fresh && player.key.value === wantedKey && tracks.value.length && held
        && (!hasWanted || wanted === current.value?.id)) {
        ;({ seed, offset, total, feedKind } = held)
        genreLabel.value = held.genreLabel ?? ''
        sourceLabel.value = source ? player.label.value : ''
        plainFeed.value = !source && !genre
        status.value = 'ready'
        syncAddress()
        return
    }

    sourceLabel.value = ''
    genreLabel.value = ''
    seed = Math.floor(Math.random() * 1e9) + 1
    offset = 0
    total = 0
    tracks.value = []
    index.value = 0
    status.value = 'loading'
    let start = 0
    let name = ''
    try {
        if (source) {
            try {
                // Lists are small, so the whole list is loaded and the player starts at the chosen track.
                const res = await api.tracks.page({ source, limit: 200, offset: 0 })
                tracks.value = res.items
                total = res.total
                offset = res.total
                name = res.label
                sourceLabel.value = res.label
                const at = hasWanted ? res.items.findIndex((t) => t.id === wanted) : -1
                start = at >= 0 ? at : 0
                player.wantPlay.value = true // opened from a list: keep playing through it
            } catch (error) {
                const code = error.statusCode ?? error.status
                showToast(code === 401 ? 'Log in to play your lists' : 'That list is not available')
                source = ''
                tracks.value = []
            }
        }

        if (!source) {
            plainFeed.value = !genre
            feedKind = plainFeed.value && mode.value === 'foryou' && foryouOn.value ? 'foryou' : 'random'
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
                plainFeed.value = true
                feedKind = mode.value === 'foryou' && foryouOn.value ? 'foryou' : 'random'
                await loadMore()
            }
        } else {
            plainFeed.value = false
            feedKind = 'random'
        }
        const items = tracks.value
        const id = source || (genre ? `genre:${genre}` : `feed:${feedKind}`)
        player.setQueue(items, { start, list: Boolean(source), id, name })
        saveMeta()
        status.value = items.length ? 'ready' : 'empty'
    } catch (error) {
        status.value = 'error'
    }
}

// The menu's "Listen" link, or a link from the Library or a list, can change the source or genre
// while this page stays mounted.
watch(() => [route.query.source, route.query.genre], () => {
    if (querySource() !== source || queryGenre() !== genre) init()
})

// The address holds the playing track, so the link can be shared and the page reloaded.
function syncAddress() {
    const id = current.value?.id
    if (id == null) return
    const query = { ...route.query, track: id }
    if (!source) delete query.source
    if (!genre || source) delete query.genre
    router.replace({ query })
}

function go(step) {
    if (!tracks.value.length) return
    menuOpen.value = false
    hint.value = false
    player.go(step)
}

watch(() => current.value?.id, (id) => {
    if (id == null) return
    syncAddress()
    const upcoming = tracks.value[index.value + 1]
    if (upcoming?.hasCover) new Image().src = `/api/tracks/${upcoming.id}/cover` // warm the next background
})

// Short messages from the player (shuffle on, end of the list...)
watch(() => player.notice.value.n, () => showToast(player.notice.value.text))

function seek(event) {
    player.seek(Number(event.target.value))
}

function fmt(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function onCoverError() {
    if (current.value) current.value.hasCover = false
}

// --- gestures: swipe, wheel, keyboard --------------------------------------

let tracking = false
let startX = 0
let startY = 0

function onDown(event) {
    if (event.target.closest('button, input, a, .vol, .pmenu')) return
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
    if (event.target.closest?.('.pmenu')) return // scrolling the dropdown must not change the track
    event.preventDefault()
    const now = Date.now()
    if (now < wheelLock || Math.abs(event.deltaY) < 20) return
    wheelLock = now + 700
    go(event.deltaY > 0 ? 1 : -1)
}

function onKey(event) {
    if (menuOpen.value) return // the dropdown has the keyboard (Escape closes it)
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

function toggleMenu() {
    if (!user.value) return openAuth(true)
    menuOpen.value = !menuOpen.value
}

// Ticking Saved or Liked in the dropdown keeps the heart and star buttons in step.
function onFlag({ kind, on }) {
    const t = current.value
    if (!t) return
    if (kind === 'like') {
        t.likes += on === t.liked ? 0 : on ? 1 : -1
        t.liked = on
    } else {
        t.favourited = on
    }
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
        const savedMode = localStorage.getItem('listenMode')
        if (savedMode === 'foryou' || savedMode === 'random') mode.value = savedMode
    } catch (error) { /* storage unavailable */ }

    player.onNearEnd(loadMore) // the shared player asks this page for more tracks
    window.addEventListener('keydown', onKey)
    loadSettings().then(() => init()) // know whether "For you" is on before the first feed is loaded
})

onBeforeUnmount(() => {
    // The music keeps playing: the mini player takes over. Only this page's own things are undone.
    player.onNearEnd(null)
    window.removeEventListener('keydown', onKey)
    clearTimeout(toastTimer)
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
    padding-bottom: 44px; /* keeps the track clear of the volume control in the corner */
    touch-action: none; /* we handle vertical swipes ourselves */
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

    /* why this track was picked for you ("Because you like Rock") */
    &__reason {
        margin: 2px 0 0;
        font-size: 13px;
        font-style: italic;
        color: var(--accent);
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
    gap: 18px;
    margin-top: 6px;

    button {
        position: relative;
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

    /* shuffle and repeat: dim when off, gold when on */
    &__mode {
        width: 36px;
        height: 36px;
        color: var(--text-2) !important;

        &:disabled {
            opacity: 0.35 !important;
            transform: none !important;
            cursor: not-allowed;
        }

        &.on {
            color: var(--accent) !important;
            opacity: 1 !important;
        }
    }

    /* the "1" of repeat-one, on the corner of the icon */
    &__one {
        position: absolute;
        right: 2px;
        bottom: 1px;
        font-size: 10px;
        line-height: 1;
        color: var(--accent);
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

    &__menu {
        position: relative; /* the dropdown opens to the left of its button */
    }

    &__btn.open {
        border-color: var(--accent);
        color: var(--accent);
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
                display: none; /* the panel is always visible on wide screens */
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
