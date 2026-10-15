<template>
    <div class="vol">
        <button type="button" class="vol__mute" :aria-label="muted ? 'Unmute' : 'Mute'" :aria-pressed="muted"
            @click="emit('update:muted', !muted)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path v-if="muted || level === 0" d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" fill="none" />
                <template v-else>
                    <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        fill="none" />
                    <path v-if="level > 0.5" d="M18.5 5.5a9 9 0 010 13" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" fill="none" />
                </template>
            </svg>
        </button>

        <!-- A short keyboard: the louder it is, the more keys light up. -->
        <div class="vol__keys">
            <b v-for="n in WHITE" :key="n" class="vol__key" :class="{ on: n <= lit }" />
            <u v-for="after in BLACK_AFTER" :key="after" class="vol__black" :class="{ on: after <= lit }"
                :style="{ left: `calc(${(after / WHITE) * 100}% - 5%)` }" />
            <input type="range" min="0" max="1" step="0.01" :value="level" aria-label="Volume" @input="onInput">
        </div>

        <span class="vol__pct">{{ Math.round(level * 100) }}%</span>
    </div>
</template>

<script setup>
const WHITE = 8
const BLACK_AFTER = [1, 2, 4, 5, 6] // black keys sit between these white keys and the next

const props = defineProps({
    modelValue: { type: Number, default: 1 },
    muted: Boolean,
})
const emit = defineEmits(['update:modelValue', 'update:muted'])

const level = computed(() => (props.muted ? 0 : props.modelValue))
const lit = computed(() => Math.ceil(level.value * WHITE))

function onInput(event) {
    const value = Number(event.target.value)
    emit('update:modelValue', value)
    if (props.muted && value > 0) emit('update:muted', false)
}
</script>

<style lang="scss">
.vol {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text);

    &__mute {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 1px solid var(--glass-line);
        border-radius: 50%;
        background: var(--glass);
        color: inherit;
        cursor: pointer;
        transition: border-color 0.2s;

        &:hover {
            border-color: var(--text-2);
        }
    }

    &__keys {
        position: relative;
        display: flex;
        gap: 2px;
        width: 128px;
        height: 32px;
    }

    &__key {
        flex: 1;
        border-radius: 0 0 4px 4px;
        background: var(--key-off);
        transition: background-color 0.15s;

        &.on {
            background: var(--key-on);
        }
    }

    &__black {
        position: absolute;
        top: 0;
        width: 10%;
        height: 60%;
        border-radius: 0 0 3px 3px;
        background: var(--key-black);
        pointer-events: none;
        transition: background-color 0.15s;

        &.on {
            background: var(--accent);
        }
    }

    // The real (invisible) slider sits on top so the keys are draggable,
    // keyboard accessible and work with touch.
    input[type='range'] {
        position: absolute;
        inset: -6px 0;
        width: 100%;
        height: calc(100% + 12px);
        margin: 0;
        opacity: 0;
        cursor: pointer;
    }

    &__pct {
        min-width: 38px;
        font-size: 13px;
        text-align: left;
        font-variant-numeric: tabular-nums;
        color: var(--text-2);
    }
}
</style>
