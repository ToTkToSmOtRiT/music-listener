<template>
    <section class="page collection">
        <header class="page__head">
            <h1>My collection</h1>
            <p>Tracks you saved and liked.</p>
        </header>

        <div v-if="!user" class="collection__empty">
            <p>Log in to see your saved and liked tracks.</p>
            <button type="button" class="btn btn--solid" @click="openAuth(true)">Log in</button>
        </div>

        <template v-else>
            <div class="collection__tabs" role="tablist">
                <button v-for="t in tabs" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id"
                    :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
            </div>

            <p v-if="status === 'loading'" class="collection__note">Loading…</p>
            <p v-else-if="status === 'error'" class="collection__note">Could not load your collection.</p>
            <p v-else-if="!items.length" class="collection__note">
                Nothing here yet. Use {{ tab === 'saved' ? 'Save' : 'the heart' }} on the listening page.
            </p>

            <ul v-else class="collection__grid">
                <li v-for="t in items" :key="t.id">
                    <NuxtLink :to="{ path: '/listener', query: { track: t.id } }" class="tile">
                        <span class="tile__art" :style="t.hasCover ? null : tileStyle(t.id)">
                            <img v-if="t.hasCover" :src="`/api/tracks/${t.id}/cover`" alt="" loading="lazy">
                            <AppIcon v-else name="listen" :size="30" />
                        </span>
                        <strong>{{ t.title }}</strong>
                        <small>{{ t.artist }}</small>
                    </NuxtLink>
                </li>
            </ul>
        </template>
    </section>
</template>

<script setup>
const api = useApi()
const user = useUser()
useHead({ title: 'My collection - Music listener' })

const tabs = [
    { id: 'saved', label: 'Saved' },
    { id: 'liked', label: 'Liked' },
]
const tab = ref('saved')
const items = ref([])
const status = ref('loading')

let requestId = 0
async function load() {
    if (!user.value) return
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
    &__tabs {
        display: inline-flex;
        margin-bottom: 22px;
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
