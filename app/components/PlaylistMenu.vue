<template>
    <div v-if="open" ref="root" class="pmenu" role="dialog" aria-label="Add to a list">
        <PlaylistList :track-id="trackId" @flag="(e) => emit('flag', e)" @changed="emit('changed')" />
    </div>
</template>

<script setup>
// The dropdown behind the player's Playlist button: Saved and Liked pinned on top, then the user's
// playlists. It closes with Escape or a click anywhere outside it (the button toggles it itself).
const props = defineProps({
    open: Boolean,
    trackId: { type: Number, default: null },
})
const emit = defineEmits(['close', 'flag', 'changed'])

const root = ref(null)

function onPointerDown(event) {
    if (root.value?.contains(event.target)) return
    if (event.target.closest?.('[data-pmenu-toggle]')) return // the button toggles it
    emit('close')
}
function onKey(event) {
    if (event.key === 'Escape') emit('close')
}

watch(() => props.open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('pointerdown', onPointerDown, true)
        window.addEventListener('keydown', onKey)
    } else {
        document.removeEventListener('pointerdown', onPointerDown, true)
        window.removeEventListener('keydown', onKey)
    }
})
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('keydown', onKey)
})
</script>

<style lang="scss">
.pmenu {
    position: absolute;
    right: calc(100% + 10px);
    bottom: -6px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    width: min(290px, calc(100vw - 100px));
    max-height: min(430px, 62dvh);
    padding: 14px;
    border: 1px solid var(--line-strong);
    border-radius: 16px;
    background: var(--bg-elev);
    color: var(--text);
    box-shadow: var(--shadow);
    animation: pmenu-in 0.16s ease both;

    // a little arrow towards the button
    &::after {
        content: '';
        position: absolute;
        right: -6px;
        bottom: 24px;
        width: 10px;
        height: 10px;
        border-top: 1px solid var(--line-strong);
        border-right: 1px solid var(--line-strong);
        background: var(--bg-elev);
        transform: rotate(45deg);
    }
}

@keyframes pmenu-in {
    from {
        opacity: 0;
        transform: translateX(8px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .pmenu {
        animation: none;
    }
}
</style>
