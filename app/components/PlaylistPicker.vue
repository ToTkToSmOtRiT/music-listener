<template>
    <Teleport to="body">
        <Transition name="picker" :duration="200">
            <div v-if="open" class="picker-backdrop" @mousedown.self="emit('close')">
                <div class="picker" role="dialog" aria-modal="true" :aria-labelledby="titleId">
                    <button type="button" class="picker__close" aria-label="Close" @click="emit('close')">&times;</button>
                    <h2 :id="titleId" class="picker__title">Add to playlist</h2>
                    <PlaylistList ref="list" :track-id="trackId" class="picker__body" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
// The pop-up version of "add this track to a list" (used from the Library, artist lists and playlists).
// The player has the same list as a dropdown, see PlaylistMenu.
const props = defineProps({
    open: Boolean,
    trackId: { type: Number, default: null },
})
const emit = defineEmits(['close'])

const titleId = useId()
const list = ref(null)

function onKey(event) {
    if (event.key === 'Escape') emit('close')
}

watch(() => props.open, async (isOpen) => {
    if (isOpen) {
        window.addEventListener('keydown', onKey)
        await nextTick()
        list.value?.reload()
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
        margin: 0 0 6px;
        font-size: 30px;
    }

    &__sub {
        margin: 0 0 14px;
        font-size: 13px;
        color: var(--text-2);
    }

    &__body {
        flex: 1;
        min-height: 0;
    }

    &__error {
        margin: 0 0 10px;
        font-size: 13px;
        color: var(--danger);
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
