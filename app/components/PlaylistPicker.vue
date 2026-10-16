<template>
    <Teleport to="body">
        <Transition name="picker" :duration="200">
            <div v-if="open" class="picker-backdrop" @mousedown.self="emit('close')">
                <div class="picker" role="dialog" aria-modal="true" :aria-labelledby="titleId">
                    <button type="button" class="picker__close" aria-label="Close" @click="emit('close')">&times;</button>
                    <h2 :id="titleId" class="picker__title">Add to playlist</h2>
                    <p class="picker__sub" aria-live="polite">{{ note || 'Pick the playlists this track belongs to.' }}</p>

                    <ul class="picker__list">
                        <li v-for="p in playlists" :key="p.id">
                            <button type="button" :aria-pressed="p.has" :class="{ on: p.has }" @click="toggle(p)">
                                <span class="picker__check"><AppIcon v-if="p.has" name="check" :size="16" /></span>
                                <span class="picker__name">{{ p.name }}</span>
                                <small>{{ p.count }} {{ p.count === 1 ? 'track' : 'tracks' }}</small>
                            </button>
                        </li>
                        <li v-if="!loading && !playlists.length" class="picker__empty">
                            You have no playlists yet. Create your first one below.
                        </li>
                    </ul>

                    <p v-if="error" class="picker__error" role="alert">{{ error }}</p>

                    <form class="picker__new" @submit.prevent="create">
                        <input ref="nameInput" v-model="newName" type="text" maxlength="80" placeholder="New playlist name"
                            aria-label="New playlist name">
                        <button type="submit" :disabled="!newName.trim() || busy">
                            <AppIcon name="plus" :size="16" /> Create
                        </button>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
const props = defineProps({
    open: Boolean,
    trackId: { type: Number, default: null },
})
const emit = defineEmits(['close', 'changed'])

const api = useApi()
const titleId = useId()
const playlists = ref([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const note = ref('')
const newName = ref('')
const nameInput = ref(null)

async function load() {
    loading.value = true
    error.value = ''
    note.value = ''
    try {
        playlists.value = await api.playlists.list(props.trackId)
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not load your playlists.'
    } finally {
        loading.value = false
    }
}

async function toggle(p) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    const was = p.has
    p.has = !was
    p.count += was ? -1 : 1
    try {
        if (was) await api.playlists.removeTrack(p.id, props.trackId)
        else await api.playlists.addTrack(p.id, props.trackId)
        note.value = was ? `Removed from ${p.name}` : `Added to ${p.name}`
        emit('changed')
    } catch (e) {
        p.has = was
        p.count += was ? 1 : -1
        error.value = e.data?.statusMessage || 'Something went wrong.'
    } finally {
        busy.value = false
    }
}

async function create() {
    const name = newName.value.trim()
    if (!name || busy.value) return
    busy.value = true
    error.value = ''
    try {
        const created = await api.playlists.create(name, props.trackId)
        playlists.value.unshift(created)
        newName.value = ''
        note.value = `Created ${created.name} and added the track`
        emit('changed')
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not create the playlist.'
    } finally {
        busy.value = false
    }
}

function onKey(event) {
    if (event.key === 'Escape') emit('close')
}

watch(() => props.open, async (isOpen) => {
    if (isOpen) {
        window.addEventListener('keydown', onKey)
        newName.value = ''
        await load()
        await nextTick()
        if (!playlists.value.length) nameInput.value?.focus()
    } else {
        window.removeEventListener('keydown', onKey)
    }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style lang="scss">
.picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1060;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(10, 10, 10, 0.55);
    backdrop-filter: blur(4px);
}

.picker {
    position: relative;
    width: 100%;
    max-width: 400px;
    max-height: 86dvh;
    display: flex;
    flex-direction: column;
    padding: 28px 24px 22px;
    border: 1px solid var(--line-strong);
    border-radius: 18px;
    background: var(--bg-elev);
    color: var(--text);
    box-shadow: var(--shadow);
    text-align: left;

    &__close {
        position: absolute;
        top: 8px;
        right: 14px;
        border: 0;
        background: none;
        font-size: 28px;
        line-height: 1;
        color: var(--text-2);
        cursor: pointer;
    }

    &__title {
        margin: 0 0 2px;
        font-size: 30px;
    }

    &__sub {
        margin: 0 0 14px;
        font-size: 13px;
        color: var(--text-2);
    }

    &__list {
        flex: 1;
        min-height: 0;
        margin: 0 0 14px;
        overflow-y: auto;
        border-top: 1px solid var(--line);

        button {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 11px 6px;
            border: 0;
            border-bottom: 1px solid var(--line);
            background: transparent;
            text-align: left;
            cursor: pointer;
            transition: background-color 0.15s;

            &:hover {
                background: var(--bg-sunk);
            }
        }

        small {
            margin-left: auto;
            font-size: 12px;
            color: var(--text-3);
        }
    }

    &__check {
        display: grid;
        flex: none;
        place-items: center;
        width: 22px;
        height: 22px;
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        color: var(--accent-ink);
    }

    &__list .on &__check {
        border-color: var(--accent);
        background: var(--accent);
    }

    &__name {
        overflow: hidden;
        font-size: 15px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__empty {
        padding: 16px 6px;
        font-size: 14px;
        color: var(--text-2);
    }

    &__error {
        margin: 0 0 10px;
        font-size: 13px;
        color: var(--danger);
    }

    &__new {
        display: flex;
        gap: 8px;

        input {
            flex: 1;
            min-width: 0;
            padding: 10px 14px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            outline: none;
            background: var(--bg);
            color: var(--text);

            &:focus {
                border-color: var(--accent);
            }
        }

        button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 16px;
            border: 0;
            border-radius: 999px;
            background: var(--ink);
            font-weight: 500;
            color: var(--ink-contrast);
            cursor: pointer;

            &:disabled {
                opacity: 0.4;
                cursor: default;
            }
        }
    }
}

.picker-enter-active,
.picker-leave-active {
    transition: opacity 0.2s ease;

    .picker {
        transition: transform 0.2s ease;
    }
}

.picker-enter-from,
.picker-leave-to {
    opacity: 0;

    .picker {
        transform: translateY(12px) scale(0.97);
    }
}
</style>
