<template>
    <section class="page pl">
        <div v-if="!user" class="pl__empty">
            <p>Log in to see this playlist.</p>
            <button type="button" class="btn btn--solid" @click="openAuth(true)">Log in</button>
        </div>

        <p v-else-if="status === 'loading'" class="pl__note">Loading…</p>
        <p v-else-if="status === 'error'" class="pl__note">Could not load this playlist.</p>
        <p v-else-if="status === 'missing'" class="pl__note">
            This playlist does not exist. <NuxtLink to="/playlists">Back to your playlists</NuxtLink>
        </p>

        <template v-else-if="playlist">
            <NuxtLink to="/playlists" class="pl__back">&larr; Playlists</NuxtLink>

            <header class="pl__head">
                <div class="pl__title">
                    <h1 v-if="!renaming">{{ playlist.name }}</h1>
                    <form v-else class="pl__rename" @submit.prevent="saveName">
                        <input ref="nameInput" v-model="nameDraft" type="text" maxlength="80" aria-label="Playlist name"
                            @keydown.esc="renaming = false">
                        <button type="submit" class="btn btn--solid">Save</button>
                    </form>
                    <button v-if="!renaming" type="button" class="pl__icon" aria-label="Rename playlist"
                        title="Rename" @click="startRename">
                        <AppIcon name="pencil" :size="18" />
                    </button>
                </div>
                <p class="pl__count">{{ playlist.tracks.length }} {{ playlist.tracks.length === 1 ? 'track' : 'tracks' }}</p>

                <div class="pl__actions">
                    <NuxtLink v-if="playlist.tracks.length" :to="{ path: '/listener', query: { source } }"
                        class="btn btn--solid"><AppIcon name="play" :size="16" /> Play</NuxtLink>

                    <label class="pl__sort">
                        <span>Sort</span>
                        <select v-model="sortChoice" :disabled="playlist.tracks.length < 2" aria-label="Sort playlist"
                            @change="applySort">
                            <option value="">Choose order…</option>
                            <option v-for="o in SORTS" :key="o.id" :value="o.id">{{ o.label }}</option>
                        </select>
                    </label>

                    <button type="button" class="btn btn--ghost" :aria-expanded="adding" @click="toggleAdd">
                        <AppIcon name="plus" :size="16" /> Add songs
                    </button>
                    <button type="button" class="btn btn--ghost pl__delete" :class="{ armed: confirmDelete }"
                        @click="removePlaylist">
                        <AppIcon name="trash" :size="16" /> {{ confirmDelete ? 'Click again to delete' : 'Delete' }}
                    </button>
                </div>
                <p class="pl__status" role="status">{{ note }}</p>
            </header>

            <section v-if="adding" class="pl__add" aria-label="Add songs">
                <label class="pl__search">
                    <AppIcon name="search" :size="18" />
                    <input ref="searchInput" v-model="query" type="search" placeholder="Search by artist or title"
                        aria-label="Search tracks">
                </label>
                <p v-if="query.trim().length < 2" class="pl__hint">Type at least 2 letters.</p>
                <p v-else-if="searching" class="pl__hint">Searching…</p>
                <p v-else-if="!results.length" class="pl__hint">No tracks found.</p>
                <ul v-else class="pl__results">
                    <li v-for="t in results" :key="t.id">
                        <span class="pl__meta"><strong>{{ t.title }}</strong><small>{{ t.artist }}</small></span>
                        <button v-if="inList.has(t.id)" type="button" class="btn btn--ghost" disabled>
                            <AppIcon name="check" :size="16" /> Added
                        </button>
                        <button v-else type="button" class="btn btn--solid" @click="addTrack(t)">
                            <AppIcon name="plus" :size="16" /> Add
                        </button>
                    </li>
                </ul>
            </section>

            <p v-if="!playlist.tracks.length" class="pl__note">
                This playlist is empty. Use "Add songs", or the Playlist button on the listening page.
            </p>

            <ol v-else class="pl__list">
                <li v-for="(t, i) in playlist.tracks" :key="t.id" draggable="true"
                    :class="{ dragging: dragFrom === i, over: dragOver === i && dragFrom !== i }"
                    @dragstart="onDragStart($event, i)" @dragover.prevent="dragOver = i" @drop.prevent="onDrop"
                    @dragend="resetDrag">
                    <span class="pl__grip" title="Drag to reorder" @pointerdown="handleDown = true">
                        <AppIcon name="grip" :size="20" />
                    </span>
                    <span class="pl__no">{{ i + 1 }}</span>

                    <NuxtLink :to="listenTo(t)" class="pl__track" draggable="false">
                        <span class="pl__art" :style="t.hasCover ? null : tileStyle(t.id)">
                            <img v-if="t.hasCover" :src="`/api/tracks/${t.id}/cover`" alt="" loading="lazy" draggable="false">
                            <AppIcon v-else name="listen" :size="18" />
                        </span>
                        <span class="pl__meta"><strong>{{ t.title }}</strong><small>{{ t.artist }}</small></span>
                    </NuxtLink>

                    <div class="pl__row">
                        <button type="button" class="pl__icon" :disabled="i === 0" :aria-label="`Move ${t.title} up`"
                            title="Move up" @click="move(i, i - 1)"><AppIcon name="up" :size="18" /></button>
                        <button type="button" class="pl__icon" :disabled="i === playlist.tracks.length - 1"
                            :aria-label="`Move ${t.title} down`" title="Move down" @click="move(i, i + 1)">
                            <AppIcon name="down" :size="18" />
                        </button>
                        <button type="button" class="pl__icon pl__icon--danger" :aria-label="`Remove ${t.title}`"
                            title="Remove" @click="removeTrack(t, i)"><AppIcon name="close" :size="18" /></button>
                    </div>
                </li>
            </ol>
        </template>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))
const source = computed(() => `playlist:${id.value}`)

const playlist = ref(null)
const status = ref('loading') // loading | ready | missing | error
const note = ref('')

useHead({ title: computed(() => `${playlist.value?.name ?? 'Playlist'} - Music listener`) })

let noteTimer
function say(message) {
    note.value = message
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => { note.value = '' }, 3000)
}

async function load() {
    if (!user.value) return
    status.value = 'loading'
    try {
        playlist.value = await api.playlists.get(id.value)
        status.value = 'ready'
    } catch (e) {
        status.value = (e.statusCode ?? e.status) === 404 ? 'missing' : 'error'
    }
}

const listenTo = (t) => ({ path: '/listener', query: { source: source.value, track: t.id } })

function tileStyle(trackId) {
    const hue = (Math.abs(trackId) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}

// --- rename -----------------------------------------------------------------

const renaming = ref(false)
const nameDraft = ref('')
const nameInput = ref(null)

async function startRename() {
    nameDraft.value = playlist.value.name
    renaming.value = true
    await nextTick()
    nameInput.value?.select()
}

async function saveName() {
    const name = nameDraft.value.trim()
    if (!name) return
    try {
        const saved = await api.playlists.rename(id.value, name)
        playlist.value.name = saved.name
        renaming.value = false
    } catch (e) {
        say(e.data?.statusMessage || 'Could not rename the playlist.')
    }
}

// --- order: move, drag, sort --------------------------------------------------

async function persistOrder() {
    try {
        await api.playlists.reorder(id.value, playlist.value.tracks.map((t) => t.id))
    } catch (e) {
        say(e.data?.statusMessage || 'Could not save the new order.')
        await load() // show what the server actually has
    }
}

async function move(from, to) {
    const list = playlist.value.tracks
    if (from === to || to < 0 || to >= list.length) return
    list.splice(to, 0, list.splice(from, 1)[0])
    await persistOrder()
}

const SORTS = [
    { id: 'title', label: 'Title A to Z' },
    { id: 'artist', label: 'Artist A to Z' },
    { id: 'newest', label: 'Recently added first' },
    { id: 'oldest', label: 'Oldest added first' },
    { id: 'shuffle', label: 'Shuffle' },
]
const sortChoice = ref('')
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

async function applySort() {
    const by = sortChoice.value
    sortChoice.value = '' // the menu is an action picker, not a state
    if (!by) return
    const list = [...playlist.value.tracks]
    const compare = {
        title: (a, b) => collator.compare(a.title, b.title) || collator.compare(a.artist, b.artist),
        artist: (a, b) => collator.compare(a.artist, b.artist) || collator.compare(a.title, b.title),
        newest: (a, b) => b.addedAt - a.addedAt || a.id - b.id,
        oldest: (a, b) => a.addedAt - b.addedAt || a.id - b.id,
    }[by]
    if (compare) list.sort(compare)
    else for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]]
    }
    playlist.value.tracks = list
    await persistOrder()
    say(`Sorted: ${SORTS.find((s) => s.id === by).label.toLowerCase()}`)
}

// Drag and drop (mouse); the arrow buttons cover touch screens and keyboards.
const dragFrom = ref(null)
const dragOver = ref(null)
let handleDown = false

function onDragStart(event, index) {
    if (!handleDown) return event.preventDefault() // only the grip starts a drag
    dragFrom.value = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
}
async function onDrop() {
    const from = dragFrom.value
    const to = dragOver.value
    resetDrag()
    if (from !== null && to !== null) await move(from, to)
}
function resetDrag() {
    dragFrom.value = null
    dragOver.value = null
    handleDown = false
}

// --- remove, delete -----------------------------------------------------------

async function removeTrack(track, index) {
    const list = playlist.value.tracks
    list.splice(index, 1)
    try {
        await api.playlists.removeTrack(id.value, track.id)
        say(`Removed ${track.title}`)
    } catch (e) {
        list.splice(index, 0, track)
        say(e.data?.statusMessage || 'Could not remove the track.')
    }
}

const confirmDelete = ref(false)
let confirmTimer
async function removePlaylist() {
    if (!confirmDelete.value) {
        confirmDelete.value = true
        clearTimeout(confirmTimer)
        confirmTimer = setTimeout(() => { confirmDelete.value = false }, 4000)
        return
    }
    try {
        await api.playlists.remove(id.value)
        router.push('/playlists')
    } catch (e) {
        confirmDelete.value = false
        say(e.data?.statusMessage || 'Could not delete the playlist.')
    }
}

// --- add songs ----------------------------------------------------------------

const adding = ref(false)
const query = ref('')
const results = ref([])
const searching = ref(false)
const searchInput = ref(null)
const inList = computed(() => new Set(playlist.value?.tracks.map((t) => t.id)))

async function toggleAdd() {
    adding.value = !adding.value
    if (adding.value) {
        await nextTick()
        searchInput.value?.focus()
    }
}

let searchTimer
let searchId = 0
watch(query, (value) => {
    clearTimeout(searchTimer)
    const q = value.trim()
    if (q.length < 2) {
        results.value = []
        searching.value = false
        return
    }
    searching.value = true
    searchTimer = setTimeout(async () => {
        const mine = ++searchId
        try {
            const res = await api.search(q)
            if (mine === searchId) results.value = res.items
        } catch (e) {
            if (mine === searchId) results.value = []
        } finally {
            if (mine === searchId) searching.value = false
        }
    }, 300)
})

async function addTrack(track) {
    try {
        await api.playlists.addTrack(id.value, track.id)
        playlist.value.tracks.push({ ...track, addedAt: Math.floor(Date.now() / 1000) })
        say(`Added ${track.title}`)
    } catch (e) {
        say(e.data?.statusMessage || 'Could not add the track.')
    }
}

onMounted(() => {
    load()
    window.addEventListener('pointerup', resetHandle)
})
onBeforeUnmount(() => {
    window.removeEventListener('pointerup', resetHandle)
    clearTimeout(noteTimer)
    clearTimeout(confirmTimer)
    clearTimeout(searchTimer)
})
function resetHandle() {
    // a click on the grip that never became a drag
    if (dragFrom.value === null) handleDown = false
}
watch(user, load)
watch(id, () => {
    adding.value = false
    load()
})
</script>

<style lang="scss">
.pl {
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

    &__empty,
    &__note {
        margin: 30px 0;
        color: var(--text-2);

        a {
            color: var(--accent);
        }
    }

    &__empty p {
        margin: 0 0 14px;
    }

    &__head {
        margin-bottom: 22px;
    }

    &__title {
        display: flex;
        align-items: center;
        gap: 10px;

        h1 {
            overflow-wrap: anywhere;
            font-size: clamp(2rem, 5vw, 3rem);
        }
    }

    &__rename {
        display: flex;
        flex: 1;
        gap: 10px;

        input {
            flex: 1;
            min-width: 0;
            padding: 8px 16px;
            border: 1px solid var(--accent);
            border-radius: 999px;
            outline: none;
            background: var(--bg-elev);
            color: var(--text);
            font: 600 24px var(--font-display);
        }
    }

    &__count {
        margin: 4px 0 16px;
        color: var(--text-2);
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }

    &__sort {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-2);

        select {
            padding: 8px 12px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            background: var(--bg-elev);
            color: var(--text);
            font: inherit;
            font-size: 14px;
            cursor: pointer;

            &:disabled {
                opacity: 0.45;
                cursor: default;
            }
        }
    }

    &__delete.armed {
        border-color: var(--danger);
        color: var(--danger);
    }

    &__status {
        min-height: 1.5em;
        margin: 10px 0 0;
        font-size: 14px;
        color: var(--accent);
    }

    &__add {
        margin-bottom: 24px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--bg-elev);
    }

    &__search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        color: var(--text-2);

        &:focus-within {
            border-color: var(--accent);
        }

        input {
            flex: 1;
            min-width: 0;
            padding: 11px 0;
            border: 0;
            outline: none;
            background: transparent;
            color: var(--text);
            font: inherit;
        }
    }

    &__hint {
        margin: 12px 4px 0;
        font-size: 14px;
        color: var(--text-2);
    }

    &__results {
        margin-top: 10px;

        li {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 4px;
            border-top: 1px solid var(--line);
        }

        .btn {
            margin-left: auto;
            padding: 6px 14px;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: default;
        }
    }

    &__list {
        counter-reset: none;

        > li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 6px;
            border-top: 1px solid var(--line);
            border-bottom: 2px solid transparent;
            transition: background-color 0.15s, opacity 0.15s;

            &:hover {
                background: var(--bg-sunk);
            }

            &.dragging {
                opacity: 0.4;
            }

            &.over {
                border-bottom-color: var(--accent);
            }
        }
    }

    &__grip {
        display: grid;
        place-items: center;
        flex: none;
        width: 28px;
        height: 36px;
        color: var(--text-3);
        cursor: grab;
        touch-action: none;

        &:active {
            cursor: grabbing;
        }
    }

    &__no {
        flex: none;
        width: 24px;
        font-size: 14px;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--text-3);
    }

    &__track {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 12px;
        min-width: 0;
        text-decoration: none;
    }

    &__art {
        display: grid;
        flex: none;
        place-items: center;
        width: 46px;
        height: 46px;
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

    &__meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
        text-align: left;

        strong {
            overflow: hidden;
            font-size: 15px;
            font-weight: 500;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--text);
        }

        small {
            overflow: hidden;
            font-size: 13px;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--text-2);
        }
    }

    &__row {
        display: flex;
        flex: none;
        gap: 2px;
    }

    &__icon {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--text-2);
        cursor: pointer;
        transition: background-color 0.15s, color 0.15s;

        &:hover:not(:disabled) {
            background: var(--bg-sunk);
            color: var(--text);
        }

        &:disabled {
            opacity: 0.25;
            cursor: default;
        }

        &--danger:hover:not(:disabled) {
            color: var(--danger);
        }
    }

    @media (max-width: 560px) {
        &__no {
            display: none;
        }

        &__art {
            width: 40px;
            height: 40px;
        }
    }
}
</style>
