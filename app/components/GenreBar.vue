<template>
    <nav class="gbar" aria-label="Genres">
        <div ref="scroller" class="gbar__scroll" role="tablist" @wheel="onWheel">
            <button v-for="chip in chips" :key="chip.slug" type="button" role="tab" :data-slug="chip.slug"
                :aria-selected="chip.slug === modelValue" :class="{ on: chip.slug === modelValue }"
                @click="emit('select', chip.slug)">
                {{ chip.label }} <small>{{ chip.count }}</small>
            </button>
        </div>
    </nav>
</template>

<script setup>
const props = defineProps({
    items: { type: Array, default: () => [] }, // [{ slug, label, count }]
    total: { type: Number, default: 0 },
    unsorted: { type: Number, default: 0 },
    modelValue: { type: String, default: null }, // '' = All, null = none (playing a list)
})
const emit = defineEmits(['select'])

const scroller = ref(null)

// "All" first, then the genres by size, and tracks without a genre last.
const chips = computed(() => [
    { slug: '', label: 'All', count: props.total },
    ...props.items,
    ...(props.unsorted > 0 ? [{ slug: 'unsorted', label: 'Unsorted', count: props.unsorted }] : []),
])

// Vertical mouse wheel scrolls the row sideways, since the row has no visible scrollbar.
function onWheel(event) {
    const el = scroller.value
    if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    el.scrollLeft += event.deltaY
    event.preventDefault()
}

// Keep the selected chip in view: after picking a genre from a track's tag, or when the
// page opens straight on a genre (for example from a home page card).
async function showActiveChip() {
    await nextTick()
    const box = scroller.value
    const chip = box?.querySelector(`[data-slug="${CSS.escape(props.modelValue ?? '')}"]`)
    if (chip) box.scrollLeft = chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2
}
watch(() => props.modelValue, showActiveChip)
onMounted(showActiveChip)
</script>

<style lang="scss">
.gbar {
    position: relative;
    z-index: 2;
    flex: none;
    padding: 10px 12px 0;

    &__scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 2px 4px 6px;
        scrollbar-width: none;
        // soft fade at both ends so it is clear the row scrolls
        mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%);

        &::-webkit-scrollbar {
            display: none;
        }

        button {
            display: inline-flex;
            flex: none;
            align-items: baseline;
            gap: 7px;
            padding: 7px 16px;
            border: 1px solid var(--glass-line);
            border-radius: 999px;
            background: var(--glass);
            backdrop-filter: blur(8px);
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            color: var(--text-2);
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s, border-color 0.2s;

            small {
                font-size: 12px;
                font-weight: 400;
                font-variant-numeric: tabular-nums;
                opacity: 0.75;
            }

            &:hover {
                border-color: var(--text-2);
                color: var(--text);
            }

            &.on {
                border-color: var(--ink);
                background: var(--ink);
                color: var(--ink-contrast);
            }
        }
    }
}
</style>
