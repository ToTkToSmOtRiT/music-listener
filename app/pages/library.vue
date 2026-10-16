<template>
    <section class="page lib">
        <header class="page__head">
            <h1>Library</h1>
            <p>Search your music, or browse it by genre and artist.</p>
        </header>

        <label class="lib__search">
            <AppIcon name="search" :size="18" />
            <input v-model="query" type="search" placeholder="Search artists and songs" aria-label="Search the library"
                autocomplete="off">
            <button v-if="query" type="button" class="lib__clear" aria-label="Clear search" @click="query = ''">
                <AppIcon name="close" :size="16" />
            </button>
        </label>

        <!-- Search results replace the browsing view while there is a query -->
        <template v-if="searchMode">
            <p v-if="searching" class="lib__note">Searching…</p>
            <p v-else-if="!results.artists.length && !results.items.length" class="lib__note">
                Nothing found for "{{ query.trim() }}".
            </p>

            <section v-if="results.artists.length" class="lib__section">
                <h2>Artists</h2>
                <ul class="lib__chips">
                    <li v-for="a in results.artists" :key="a.key">
                        <button type="button" class="chip" @click="openKey = a.key">
                            {{ a.name }} <small>{{ a.count }}</small>
                        </button>
                    </li>
                </ul>
            </section>

            <section v-if="results.items.length" class="lib__section">
                <h2>Songs</h2>
                <ul class="lib__tracks">
                    <li v-for="t in results.items" :key="t.id">
                        <NuxtLink :to="{ path: '/listener', query: { track: t.id } }" class="lib__track">
                            <span class="lib__art" :style="t.hasCover ? null : tileStyle(t.id)">
                                <img v-if="t.hasCover" :src="`/api/tracks/${t.id}/cover`" alt="" loading="lazy">
                                <AppIcon v-else name="listen" :size="16" />
                            </span>
                            <span class="lib__meta"><strong>{{ t.title }}</strong><small>{{ t.artist }}</small></span>
                        </NuxtLink>
                        <button type="button" class="lib__add" :aria-label="`Add ${t.title} to a playlist`"
                            title="Add to playlist" @click="pickerTrack = t.id">
                            <AppIcon name="list-add" :size="18" />
                        </button>
                    </li>
                </ul>
            </section>
        </template>

        <!-- Browsing: genre tabs, then the artists under each genre -->
        <template v-else>
            <GenreBar v-if="genreData?.items.length" class="lib__tabs" :items="genreData.items" :total="genreData.total"
                :unsorted="genreData.unsorted" :model-value="genre" @select="selectGenre" />

            <p v-if="genreData?.scanning.running" class="lib__note" role="status">
                Still reading your files' tags ({{ genreData.scanning.done }} of {{ genreData.scanning.total }}).
                Genres and artists fill in as it goes.
            </p>

            <p v-if="status === 'loading'" class="lib__note">Loading…</p>
            <p v-else-if="status === 'error'" class="lib__note">Could not load the library.</p>
            <p v-else-if="!groups.length" class="lib__note">
                No music yet. Choose your music folder in
                <NuxtLink to="/collection?tab=local">My collection &rarr; Local</NuxtLink>.
            </p>

            <!-- one genre: all its artists, A to Z -->
            <template v-else-if="genre">
                <p v-if="!selected" class="lib__note">
                    There are no artists in that genre. <a href="/library" @click.prevent="selectGenre('')">Show all</a>
                </p>
                <section v-else class="lib__section">
                    <div class="lib__title">
                        <h2>{{ selected.label }}</h2>
                        <span>{{ selected.artists.length }} {{ selected.artists.length === 1 ? 'artist' : 'artists' }}</span>
                        <NuxtLink :to="{ path: '/listener', query: { genre: selected.slug } }" class="btn btn--solid">
                            <AppIcon name="play" :size="16" /> Play {{ selected.label }}
                        </NuxtLink>
                    </div>
                    <div v-for="part in lettered(selected.artists)" :key="part.letter" class="lib__letter">
                        <h3>{{ part.letter }}</h3>
                        <ul class="lib__chips">
                            <li v-for="a in part.artists" :key="a.key">
                                <button type="button" class="chip" @click="openKey = a.key">
                                    {{ a.name }} <small>{{ a.count }}</small>
                                </button>
                            </li>
                        </ul>
                    </div>
                </section>
            </template>

            <!-- All: every genre with its artists beneath -->
            <template v-else>
                <section v-for="g in groups" :key="g.slug" class="lib__section">
                    <div class="lib__title">
                        <h2>{{ g.label }}</h2>
                        <span>{{ g.artists.length }} {{ g.artists.length === 1 ? 'artist' : 'artists' }}</span>
                        <a :href="`/library?genre=${g.slug}`" class="lib__more"
                            @click.prevent="selectGenre(g.slug)">Open</a>
                    </div>
                    <ul class="lib__chips">
                        <li v-for="a in visibleArtists(g)" :key="a.key">
                            <button type="button" class="chip" @click="openKey = a.key">
                                {{ a.name }} <small>{{ a.count }}</small>
                            </button>
                        </li>
                        <li v-if="g.artists.length > PREVIEW">
                            <button type="button" class="chip chip--more" @click="expanded[g.slug] = !expanded[g.slug]">
                                {{ expanded[g.slug] ? 'Show fewer' : `Show all ${g.artists.length}` }}
                            </button>
                        </li>
                    </ul>
                </section>
            </template>
        </template>

        <ArtistDialog :artist-key="openKey" @close="openKey = null" />
        <PlaylistPicker :open="pickerTrack !== null" :track-id="pickerTrack" @close="pickerTrack = null" />
    </section>
</template>

<script setup>
const api = useApi()
const route = useRoute()
const router = useRouter()
useHead({ title: 'Library - Music listener' })

// The genre tabs. The counts keep growing while the server reads the files' tags.
const { data: genreData, refresh: refreshGenres } = useFetch('/api/genres', { key: 'genres', lazy: true })

const genre = computed(() => (typeof route.query.genre === 'string' ? route.query.genre : ''))
function selectGenre(slug) {
    router.replace({ query: slug ? { genre: slug } : {} })
}

// --- artists per genre ----------------------------------------------------------
const PREVIEW = 24 // in the "All" view, the biggest artists of each genre; "Show all" opens the rest
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

const groups = ref([])
const status = ref('loading')
const expanded = reactive({})
const selected = computed(() => groups.value.find((g) => g.slug === genre.value) ?? null)

async function loadArtists() {
    try {
        groups.value = (await api.artists.list()).groups
        status.value = 'ready'
    } catch (error) {
        status.value = 'error'
    }
}

const visibleArtists = (g) => (expanded[g.slug] ? [...g.artists].sort((a, b) => collator.compare(a.name, b.name)) : g.artists.slice(0, PREVIEW))

// "A", "B", ... with "#" (names starting with a digit or symbol) last
function lettered(artists) {
    const parts = new Map()
    for (const a of [...artists].sort((x, y) => collator.compare(x.name, y.name))) {
        const first = a.name.charAt(0).toLocaleUpperCase()
        const letter = /\p{L}/u.test(first) ? first : '#'
        parts.set(letter, [...(parts.get(letter) ?? []), a])
    }
    return [...parts].sort(([a], [b]) => (a === '#') - (b === '#') || collator.compare(a, b))
        .map(([letter, list]) => ({ letter, artists: list }))
}

// While tags are still being read, keep the lists fresh; reload once more when it finishes.
let poll
watch(() => genreData.value?.scanning.running, (running, wasRunning) => {
    if (!import.meta.client) return
    clearInterval(poll)
    if (running) {
        poll = setInterval(async () => {
            await refreshGenres()
            await loadArtists()
        }, 3000)
    } else if (wasRunning) {
        loadArtists()
    }
}, { immediate: true })

// --- search -----------------------------------------------------------------------
const query = ref('')
const results = ref({ artists: [], items: [] })
const searching = ref(false)
const searchMode = computed(() => query.value.trim().length >= 2)

let timer
let searchId = 0
watch(query, (value) => {
    clearTimeout(timer)
    const q = value.trim()
    if (q.length < 2) {
        results.value = { artists: [], items: [] }
        searching.value = false
        return
    }
    searching.value = true
    timer = setTimeout(async () => {
        const mine = ++searchId
        try {
            const res = await api.search(q)
            if (mine === searchId) results.value = res
        } catch (error) {
            if (mine === searchId) results.value = { artists: [], items: [] }
        } finally {
            if (mine === searchId) searching.value = false
        }
    }, 300)
})

// --- dialogs ------------------------------------------------------------------------
const openKey = ref(null) // the artist whose tracks are open
const pickerTrack = ref(null)

function tileStyle(id) {
    const hue = (Math.abs(id) * 137) % 360
    return { background: `linear-gradient(135deg, hsl(${hue} 50% var(--tile-l1)), hsl(${(hue + 70) % 360} 55% var(--tile-l2)))` }
}

onMounted(loadArtists)
onBeforeUnmount(() => {
    clearInterval(poll)
    clearTimeout(timer)
})
</script>

<style lang="scss">
.lib {
    &__search {
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 560px;
        margin-bottom: 22px;
        padding: 0 16px;
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        background: var(--bg-elev);
        color: var(--text-2);

        &:focus-within {
            border-color: var(--accent);
        }

        input {
            flex: 1;
            min-width: 0;
            padding: 12px 0;
            border: 0;
            outline: none;
            background: transparent;
            color: var(--text);
            font: inherit;

            &::placeholder {
                color: var(--text-3);
            }
        }
    }

    &__clear {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
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

    // the genre tabs reuse the Listen-page component; on this page they scroll with the content
    &__tabs {
        margin: 0 -12px 8px;
    }

    &__note {
        margin: 24px 0;
        color: var(--text-2);

        a {
            color: var(--accent);
        }
    }

    &__section {
        margin-top: 30px;

        h2 {
            font-size: clamp(24px, 4vw, 30px);
        }
    }

    &__title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 14px;
        margin-bottom: 14px;

        span {
            font-size: 14px;
            color: var(--text-2);
        }

        .btn {
            margin-left: auto;
        }
    }

    &__more {
        margin-left: auto;
        font-size: 14px;
        text-decoration: none;
        color: var(--accent);

        &:hover {
            text-decoration: underline;
        }
    }

    &__letter {
        margin-top: 18px;

        h3 {
            margin-bottom: 8px;
            font-size: 22px;
            color: var(--accent);
        }
    }

    &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    &__tracks {
        margin-top: 10px;
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
        padding: 8px 6px;
        text-decoration: none;
    }

    &__art {
        display: grid;
        flex: none;
        place-items: center;
        width: 44px;
        height: 44px;
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

// An artist name; the small number is how many of their tracks are in that genre
.chip {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
    padding: 7px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--bg-elev);
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background-color 0.15s;

    small {
        font-size: 12px;
        color: var(--text-3);
    }

    &:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    &--more {
        border-style: dashed;
        color: var(--text-2);
    }
}
</style>
