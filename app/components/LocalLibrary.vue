<template>
    <div class="local">
        <p v-if="status === 'loading'" class="local__note">Loading…</p>
        <p v-else-if="status === 'error'" class="local__note">Could not load the music folder settings.</p>

        <template v-else-if="info">
            <p class="local__intro">
                Point the app at a folder of music on this computer. Subfolders are included and only
                <code>.mp3</code> files are used. The files are only read, never changed.
            </p>

            <p v-if="!info.canEdit" class="local__locked">
                The music folder can only be changed on the computer that runs the app. Open the app there to
                change it.
            </p>

            <form class="local__form" @submit.prevent="save">
                <label for="local-dir">Music folder</label>
                <div class="local__row">
                    <input id="local-dir" v-model="draft" type="text" spellcheck="false" autocomplete="off"
                        :disabled="!info.canEdit || saving" placeholder="Full path, for example E:\Music"
                        @input="message = ''">
                    <button type="submit" class="btn btn--solid" :disabled="!info.canEdit || saving || !changed">
                        {{ saving ? 'Saving…' : 'Save' }}
                    </button>
                </div>
                <p class="local__hint">
                    Tip: in Explorer, hold Shift, right-click the folder and choose "Copy as path", then paste it here.
                </p>
                <p v-if="message" class="local__message" :class="{ 'local__message--error': isError }" role="status">
                    {{ message }}
                </p>
            </form>

            <section class="local__stats" aria-label="Music folder status">
                <div>
                    <strong>{{ info.tracks }}</strong>
                    <span>{{ info.tracks === 1 ? 'track' : 'tracks' }} found</span>
                </div>
                <div v-if="info.canEdit">
                    <strong>{{ stateLabel }}</strong>
                    <span>Folder</span>
                </div>
                <div>
                    <strong>{{ scanLabel }}</strong>
                    <span>Reading tags</span>
                </div>
            </section>

            <p v-if="info.error" class="local__message local__message--error" role="alert">{{ info.error }}</p>

            <div class="local__actions">
                <NuxtLink v-if="info.tracks" to="/listener" class="btn btn--solid">
                    <AppIcon name="play" :size="16" /> Play local music
                </NuxtLink>
                <button v-if="info.canEdit && info.configured" type="button" class="btn btn--ghost" :disabled="busy"
                    @click="rescan">
                    {{ busy ? 'Scanning…' : 'Rescan folder' }}
                </button>
                <button v-if="info.canEdit && info.source === 'saved'" type="button" class="btn btn--ghost"
                    :disabled="busy || saving" @click="reset">
                    Use the default folder
                </button>
            </div>

            <p v-if="info.canEdit && info.source === 'env'" class="local__hint">
                This is the default folder from <code>MUSIC_DIR</code> in the <code>.env</code> file. Save a different
                path above to override it.
            </p>
            <p v-if="info.canEdit" class="local__hint">
                Switching folders keeps your likes, saved tracks and playlists. Tracks from a folder you switched
                away from are hidden and come back if you switch back.
            </p>
        </template>
    </div>
</template>

<script setup>
const api = useApi()

const info = ref(null)
const status = ref('loading')
const draft = ref('')
const saving = ref(false)
const busy = ref(false)
const message = ref('')
const isError = ref(false)

const changed = computed(() => draft.value.trim() !== (info.value?.dir ?? ''))
const stateLabel = computed(() => {
    if (!info.value?.configured) return 'Not set'
    return info.value.exists ? 'Found' : 'Not found'
})
const scanLabel = computed(() => {
    const s = info.value?.scanning
    if (info.value?.indexing) return 'Listing files…'
    if (s?.running) return `${s.done} / ${s.total}`
    return 'Done'
})

function apply(data, { keepDraft = false } = {}) {
    info.value = data
    if (!keepDraft) draft.value = data.dir ?? ''
}

async function load() {
    try {
        apply(await api.library.get())
        status.value = 'ready'
        pollWhileScanning()
    } catch (e) {
        status.value = 'error'
    }
}

let timer
function pollWhileScanning() {
    clearInterval(timer)
    if (!info.value?.scanning.running && !info.value?.indexing) return
    timer = setInterval(async () => {
        try {
            apply(await api.library.get(), { keepDraft: true })
            if (!info.value.scanning.running && !info.value.indexing) clearInterval(timer)
        } catch (e) {
            clearInterval(timer)
        }
    }, 1500)
}

function report(text, error = false) {
    message.value = text
    isError.value = error
}

async function save() {
    saving.value = true
    report('')
    try {
        apply(await api.library.save(draft.value))
        report(info.value.tracks
            ? `Using this folder. ${info.value.tracks} tracks found.`
            : 'Folder saved, but no .mp3 files were found in it.')
        pollWhileScanning()
    } catch (e) {
        report(e.data?.statusMessage || 'Could not save the folder.', true)
    } finally {
        saving.value = false
    }
}

async function rescan() {
    busy.value = true
    report('')
    try {
        apply(await api.library.rescan(), { keepDraft: true })
        report(`Rescanned. ${info.value.tracks} tracks found.`)
        pollWhileScanning()
    } catch (e) {
        report(e.data?.statusMessage || 'Could not rescan the folder.', true)
    } finally {
        busy.value = false
    }
}

async function reset() {
    saving.value = true
    report('')
    try {
        apply(await api.library.save(''))
        report(info.value.dir ? 'Back to the default folder.' : 'The folder setting was cleared.')
        pollWhileScanning()
    } catch (e) {
        report(e.data?.statusMessage || 'Could not reset the folder.', true)
    } finally {
        saving.value = false
    }
}

onMounted(load)
onBeforeUnmount(() => clearInterval(timer))
</script>

<style lang="scss">
.local {
    max-width: 720px;

    code {
        padding: 1px 6px;
        border-radius: 6px;
        background: var(--bg-sunk);
        font-size: 0.9em;
    }

    &__note {
        margin: 30px 0;
        color: var(--text-2);
    }

    &__intro {
        margin: 0 0 18px;
        color: var(--text-2);
    }

    &__locked {
        margin: 0 0 18px;
        padding: 12px 16px;
        border: 1px solid var(--line-strong);
        border-radius: 12px;
        background: var(--bg-elev);
        font-size: 14px;
        color: var(--text-2);
    }

    &__form {
        label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
        }
    }

    &__row {
        display: flex;
        gap: 10px;

        input {
            flex: 1;
            min-width: 0;
            padding: 11px 16px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            outline: none;
            background: var(--bg-elev);
            color: var(--text);
            font: inherit;
            font-size: 15px;

            &:focus {
                border-color: var(--accent);
            }

            &:disabled {
                opacity: 0.6;
            }
        }

        .btn:disabled {
            opacity: 0.4;
            cursor: default;
        }
    }

    &__hint {
        margin: 8px 4px 0;
        font-size: 13px;
        color: var(--text-3);
    }

    &__message {
        margin: 10px 4px 0;
        font-size: 14px;
        color: var(--accent);

        &--error {
            color: var(--danger);
        }
    }

    &__stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 26px 0 18px;

        div {
            display: flex;
            flex-direction: column;
            padding: 14px 16px;
            border: 1px solid var(--line);
            border-radius: 14px;
            background: var(--bg-elev);
        }

        strong {
            font-family: var(--font-display);
            font-size: 28px;
            font-weight: 600;
            line-height: 1.1;
        }

        span {
            font-size: 13px;
            color: var(--text-2);
        }
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
    }
}
</style>
