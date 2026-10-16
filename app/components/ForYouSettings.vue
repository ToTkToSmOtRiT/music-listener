<template>
    <Teleport to="body">
        <Transition name="picker" :duration="200">
            <div v-if="open" class="picker-backdrop" @mousedown.self="emit('close')">
                <div class="picker fy-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
                    <button type="button" class="picker__close" aria-label="Close" @click="emit('close')">&times;</button>
                    <h2 :id="titleId" class="picker__title">For you</h2>
                    <p class="picker__sub">
                        Your Listen feed learns from what you play to the end, skip, like, save and add to playlists.
                        It all stays on this server.
                    </p>
                    <ForYouPanel @changed="emit('changed')" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
// The player's "For you" settings window. The same controls live in Profile > Settings.
const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'changed'])

const titleId = useId()

function onKey(event) {
    if (event.key === 'Escape') emit('close')
}
watch(() => props.open, (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style lang="scss">
.fy-dialog {
    max-width: 440px;
    overflow-y: auto;
}
</style>
