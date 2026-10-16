<template>
    <div>
        <section id="head-section" data-aos="fade">
            <p class="eyebrow">Listen &middot; Like &middot; Discuss</p>
            <h1>Music, one track at a time</h1>
            <p class="lead">Swipe through songs, save the ones you love and talk about every track.</p>
            <a class="btn btn--solid btn--lg" href="/listener" @click.prevent="go('/listener')">Start listening</a>
        </section>

        <section id="features">
            <article v-for="(f, i) in features" :key="f.title" class="feature" data-aos="fade-up"
                :data-aos-delay="i * 120">
                <span class="feature__no">0{{ i + 1 }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.text }}</p>
            </article>
        </section>

        <section v-if="genreData?.items.length" id="genres">
            <h2 data-aos="fade">Genres</h2>
            <p class="genres-note" data-aos="fade">Pick a genre to listen to only that kind of music.</p>
            <ul class="genres-list" data-aos="fade" data-aos-duration="1200">
                <li>
                    <a href="/listener" class="genre" @click.prevent="go('/listener')">
                        <strong>All music</strong>
                    </a>
                </li>
                <li v-for="g in genreData.items" :key="g.slug">
                    <a :href="`/listener?genre=${g.slug}`" class="genre"
                        @click.prevent="go({ path: '/listener', query: { genre: g.slug } })">
                        <strong>{{ g.label }}</strong>
                    </a>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup>
const features = [
    { title: 'Swipe to discover', text: 'One track fills the screen. Swipe up for the next, down to go back.' },
    { title: 'Talk about every track', text: 'Each song has its own comment section, so the conversation stays with the music.' },
    { title: 'Keep what you love', text: 'Like tracks, save favourites and share a song with a single link.' },
]

// Genre cards come from the library itself, so they only list genres that have tracks.
const { data: genreData } = useFetch('/api/genres', { key: 'genres' })

// The home page is the welcome page for visitors who are not logged in. Listening needs an account, so
// "Start listening" and the genre cards open the log in / sign up window instead of the player. After
// logging in the visitor continues to what they clicked; logging in by other means goes to the start page.
// (Logged-in visitors never get here, see the middleware.)
const user = useUser()
const modal = useAuthModal()
const pending = ref(null)

function go(target) {
    if (user.value) return navigateTo(target)
    pending.value = target
    openAuth(true, 'Log in or sign up to start listening.')
}

watch(user, (loggedIn) => {
    if (loggedIn) navigateTo(pending.value ?? HOME_FOR_USERS, { replace: true })
})

// Closing the window without logging in cancels the click.
watch(() => modal.value.open, (open) => {
    if (!open && !user.value) pending.value = null
})

// A visitor who typed (or followed) the address of another page is sent here by the route guard with
// ?next=<that address>. Show the login window and, after logging in, continue to that page.
const route = useRoute()
const router = useRouter()

// Only internal paths: "/listener?track=5" is fine, "//evil.example" or "https://evil.example" are not.
function safeNext(value) {
    return typeof value === 'string' && /^\/(?![/\\])/.test(value) && value !== '/' ? value : null
}

function applyNext() {
    if (route.query.next === undefined) return
    let next = safeNext(route.query.next)
    if (next && !router.resolve(next).matched.length) next = null // not a real page: nothing to continue to
    router.replace({ path: '/', query: {} }) // tidy the address bar
    if (!next || user.value) return
    pending.value = next
    openAuth(true, 'Log in or sign up to open that page.')
}

onMounted(applyNext)
watch(() => route.query.next, applyNext)
</script>

<style lang="scss">
#head-section {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    min-height: clamp(440px, 72vh, 680px);
    padding: 48px 20px;
    background-image: linear-gradient(var(--hero-shade), var(--hero-shade)), url('~/assets/pxfuel.jpg');
    background-size: cover;
    background-position: center;

    .eyebrow {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent);
    }

    h1 {
        max-width: 14ch;
        font-size: clamp(2.6rem, 8vw, 5.2rem);
    }

    .lead {
        max-width: 34em;
        margin: 0 0 10px;
        font-size: clamp(16px, 2.2vw, 19px);
        color: color-mix(in srgb, var(--text) 85%, transparent);
    }
}

#features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    max-width: 1060px;
    margin: clamp(40px, 7vw, 90px) auto 0;
    padding: 0 20px;

    .feature {
        padding: 28px 24px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--bg-elev);
        text-align: left;
        transition: border-color 0.2s, transform 0.2s;

        &:hover {
            border-color: var(--line-strong);
            transform: translateY(-3px);
        }

        &__no {
            font-family: var(--font-display);
            font-size: 30px;
            color: var(--accent);
        }

        h3 {
            margin: 6px 0 8px;
            font-size: 26px;
        }

        p {
            margin: 0;
            font-size: 15px;
            color: var(--text-2);
        }
    }
}

#genres {
    max-width: 760px;
    margin: clamp(50px, 8vw, 100px) auto 0;
    padding: 0 20px;

    h2 {
        margin-bottom: 8px;
        font-size: clamp(2rem, 5vw, 2.8rem);
    }

    .genres-note {
        margin: 0 0 24px;
        color: var(--text-2);
    }

    .genres-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        grid-auto-rows: 1fr;
        gap: clamp(10px, 2vw, 16px);
    }

    .genre {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-height: clamp(72px, 10vw, 92px);
        padding: 12px;
        border: 1px solid var(--line);
        border-top: 3px solid var(--accent); // the theme's gold
        border-radius: 14px;
        background: var(--bg-elev);
        text-decoration: none;
        transition: background-color 0.2s, border-color 0.2s, transform 0.2s;

        strong {
            font-family: var(--font-display);
            font-size: clamp(20px, 3.4vw, 26px);
            font-weight: 600;
            line-height: 1.1;
            color: var(--accent);
        }

        &:hover {
            border-color: var(--accent);
            background: var(--bg-sunk);
            transform: translateY(-3px);
        }
    }
}
</style>
