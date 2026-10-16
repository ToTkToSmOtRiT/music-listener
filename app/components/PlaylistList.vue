<template>
    <div class="pl-menu">
        <p class="pl-menu__note" aria-live="polite">{{ note || 'Tick the lists this track belongs to.' }}</p>

        <ul class="pl-menu__list">
            <!-- Saved and Liked are pinned on top of the user's own playlists -->
            <li v-for="s in special" :key="s.key" class="pl-menu__pinned">
                <button type="button" :aria-pressed="s.has" :class="{ on: s.has }" @click="toggleSpecial(s)">
                    <span class="pl-menu__check"><AppIcon v-if="s.has" name="check" :size="14" /></span>
                    <AppIcon :name="s.key === 'saved' ? 'star' : 'heart'" :size="16" class="pl-menu__icon" />
                    <span class="pl-menu__name">{{ s.name }}</span>
                    <small>{{ s.count }}</small>
                </button>
            </li>
            <li v-if="special.length" class="pl-menu__sep" role="separator" />
            <li v-for="p in playlists" :key="p.id">
                <button type="button" :aria-pressed="p.has" :class="{ on: p.has }" @click="toggle(p)">
                    <span class="pl-menu__check"><AppIcon v-if="p.has" name="check" :size="14" /></span>
                    <span class="pl-menu__name">{{ p.name }}</span>
                    <small>{{ p.count }}</small>
                </button>
            </li>
            <li v-if="!loading && !playlists.length" class="pl-menu__empty">No playlists yet. Create one below.</li>
        </ul>

        <p v-if="error" class="pl-menu__error" role="alert">{{ error }}</p>

        <form class="pl-menu__new" @submit.prevent="create">
            <input ref="nameInput" v-model="newName" type="text" maxlength="80" placeholder="New playlist name"
                aria-label="New playlist name">
            <button type="submit" :disabled="!newName.trim() || busy" aria-label="Create playlist">
                <AppIcon name="plus" :size="16" /> Create
            </button>
        </form>
    </div>
</template>

<script setup>
// Where a track is added: Saved and Liked (pinned) and the user's playlists. Used by the dropdown on the
// player and by the pop-up window in the Library, the artist list and so on.
const props = defineProps({ trackId: { type: Number, default: null } })
const emit = defineEmits(['flag', 'changed'])

const api = useApi()
const special = ref([])
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
    try {
        const [s, p] = await Promise.all([api.playlists.special(props.trackId), api.playlists.list(props.trackId)])
        special.value = s
        playlists.value = p
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not load your lists.'
    } finally {
        loading.value = false
    }
}

async function toggleSpecial(s) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    const was = s.has
    const kind = s.key === 'saved' ? 'favourite' : 'like'
    s.has = !was
    s.count += was ? -1 : 1
    try {
        await api.tracks.setFlag(props.trackId, kind, !was)
        note.value = was ? `Removed from ${s.name}` : `Added to ${s.name}`
        emit('flag', { kind, on: !was })
    } catch (e) {
        s.has = was
        s.count += was ? 1 : -1
        error.value = e.data?.statusMessage || 'Something went wrong.'
    } finally {
        busy.value = false
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

watch(() => props.trackId, load, { immediate: true })
defineExpose({ reload: load, focusNew: () => nameInput.value?.focus() })
</script>

<style lang="scss">
.pl-menu {
    display: flex;
    flex-direction: column;
    min-height: 0;
    text-align: left;

    &__note {
        margin: 0 0 8px;
        font-size: 12px;
        color: var(--text-2);
    }

    &__list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        border-top: 1px solid var(--line);

        button {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 9px 6px;
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

    &__pinned button {
        font-weight: 500;
    }

    &__icon {
        flex: none;
        color: var(--accent);
    }

    &__sep {
        height: 6px;
        background: var(--bg-sunk);
    }

    &__check {
        display: grid;
        flex: none;
        place-items: center;
        width: 20px;
        height: 20px;
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
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__empty {
        padding: 12px 6px;
        font-size: 13px;
        color: var(--text-2);
    }

    &__error {
        margin: 8px 0 0;
        font-size: 12px;
        color: var(--danger);
    }

    &__new {
        display: flex;
        gap: 6px;
        margin-top: 10px;

        input {
            flex: 1;
            min-width: 0;
            padding: 8px 12px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            outline: none;
            background: var(--bg);
            color: var(--text);
            font-size: 13px;

            &:focus {
                border-color: var(--accent);
            }
        }

        button {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 7px 12px;
            border: 0;
            border-radius: 999px;
            background: var(--ink);
            font-size: 13px;
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
</style>
