<template>
    <div class="backdrop" aria-hidden="true">
        <div v-for="(layer, i) in layers" :key="i" class="backdrop__layer" :class="{ active: active === i }"
            :style="layer.style" />
        <div class="backdrop__shade" />
    </div>
</template>

<script setup>
// Two stacked layers: the next cover is loaded into the hidden one, then the
// layers cross-fade (CSS opacity transition) so the background never pops.
const props = defineProps({
    src: { type: String, default: '' },
    seed: { type: Number, default: 0 },
})

// Tracks without cover art get a gradient whose colour is derived from the track id.
function styleFor(src, seed) {
    if (src) return { backgroundImage: `url("${src}")` }
    const hue = (Math.abs(seed) * 137) % 360
    return { backgroundImage: `linear-gradient(135deg, hsl(${hue} 45% var(--fb-l1)), hsl(${(hue + 70) % 360} 55% var(--fb-l2)))` }
}

const layers = ref([{ style: styleFor(props.src, props.seed) }, { style: {} }])
const active = ref(0)
let token = 0

watch(() => [props.src, props.seed], ([src, seed]) => {
    const mine = ++token
    const next = 1 - active.value
    const show = (style) => {
        if (mine !== token) return // a newer track arrived meanwhile
        layers.value[next].style = style
        active.value = next
    }
    if (!src) return show(styleFor('', seed))
    const img = new Image()
    img.onload = () => show(styleFor(src, seed))
    img.onerror = () => show(styleFor('', seed))
    img.src = src
})
</script>

<style lang="scss">
.backdrop {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    background: var(--bg);

    &__layer {
        position: absolute;
        inset: -60px;
        background-size: cover;
        background-position: center;
        filter: blur(38px) saturate(1.3);
        opacity: 0;
        transition: opacity 1.1s ease;

        &.active {
            opacity: 1;
        }
    }

    // Dark theme: the cover is dimmed. Light theme: it is washed out with ivory.
    &__shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, var(--shade-top), var(--shade-bottom));
        transition: background 0.25s ease;
    }
}
</style>
