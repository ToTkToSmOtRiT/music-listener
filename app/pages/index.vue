<template>
    <div>
        <section id="head-section" data-aos="fade">
            <p class="eyebrow">Listen &middot; Like &middot; Discuss</p>
            <h1>Music, one track at a time</h1>
            <p class="lead">Swipe through songs, save the ones you love and talk about every track.</p>
            <NuxtLink class="btn btn--solid btn--lg" to="/listener">Start listening</NuxtLink>
        </section>

        <section id="features">
            <article v-for="(f, i) in features" :key="f.title" class="feature" data-aos="fade-up"
                :data-aos-delay="i * 120">
                <span class="feature__no">0{{ i + 1 }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.text }}</p>
            </article>
        </section>

        <section id="genres">
            <h2 data-aos="fade">Genres</h2>
            <ul class="genres-list" data-aos="fade" data-aos-duration="1200">
                <li v-for="genre in genres" :key="genre">{{ genre }}</li>
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
const genres = ['Pop', 'Rock', 'Rap', 'Jazz', 'Folk', 'Funk']
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
        margin-bottom: 24px;
        font-size: clamp(2rem, 5vw, 2.8rem);
    }

    .genres-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: clamp(10px, 2vw, 16px);

        li {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: clamp(70px, 12vw, 110px);
            border: 1px solid var(--line);
            border-radius: 14px;
            background: var(--bg-elev);
            font-family: var(--font-display);
            font-size: clamp(20px, 4vw, 28px);
            font-weight: 600;
            transition: background-color 0.2s, color 0.2s, border-color 0.2s;

            &:hover {
                border-color: var(--accent);
                background: var(--bg-sunk);
                color: var(--accent);
            }
        }
    }

    @media (max-width: 420px) {
        .genres-list {
            grid-template-columns: repeat(2, 1fr);
        }
    }
}
</style>
