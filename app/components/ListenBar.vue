<template>
    <div class="lbar">
        <div class="lbar__modes" role="tablist" aria-label="What to listen to">
            <button type="button" role="tab" :aria-selected="effective === 'foryou'" :class="{ on: effective === 'foryou', off: !enabled }"
                :title="enabled ? undefined : 'Turned off: open the settings to turn it on'" @click="chooseForYou">
                <AppIcon name="sparkle" :size="16" /> For you
                <small v-if="enabled && learning">learning</small>
                <small v-else-if="!enabled">off</small>
            </button>
            <button type="button" role="tab" :aria-selected="effective === 'random'" :class="{ on: effective === 'random' }"
                @click="emit('update:mode', 'random')">Random</button>
        </div>

        <button type="button" class="lbar__gear" aria-label="For you settings" title="For you settings" @click="settingsOpen = true">
            <AppIcon name="tune" :size="18" />
        </button>

        <ForYouSettings :open="settingsOpen" @close="settingsOpen = false" @changed="emit('settings-changed')" />
    </div>
</template>

<script setup>
const props = defineProps({
    mode: { type: String, default: 'foryou' },
    enabled: { type: Boolean, default: true },
    learning: Boolean,
})
const emit = defineEmits(['update:mode', 'settings-changed'])

const settingsOpen = ref(false)

// With "For you" switched off, the feed is random whatever was chosen before.
const effective = computed(() => (props.enabled ? props.mode : 'random'))

function chooseForYou() {
    if (props.enabled) emit('update:mode', 'foryou')
    else settingsOpen.value = true // it is off: the switch is in the settings window
}
</script>

<style lang="scss">
.lbar {
    position: relative;
    z-index: 2;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 12px 0;

    &__modes {
        display: inline-flex;
        padding: 3px;
        border: 1px solid var(--glass-line);
        border-radius: 999px;
        background: var(--glass);
        backdrop-filter: blur(8px);

        button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 16px;
            border: 0;
            border-radius: 999px;
            background: transparent;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-2);
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s;

            small {
                font-size: 11px;
                font-weight: 400;
                opacity: 0.8;
            }

            &.off {
                opacity: 0.7;
            }

            &:hover {
                color: var(--text);
            }

            &.on {
                background: var(--ink);
                color: var(--ink-contrast);
            }
        }
    }

    &__gear {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid var(--glass-line);
        border-radius: 50%;
        background: var(--glass);
        backdrop-filter: blur(8px);
        color: var(--text-2);
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s;

        &:hover {
            border-color: var(--text-2);
            color: var(--text);
        }
    }
}
</style>
