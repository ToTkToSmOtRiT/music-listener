<template>
    <div class="tswitch" role="group" aria-label="Colour theme">
        <button v-for="option in options" :key="option.id" type="button" :class="{ on: theme === option.id }"
            :aria-pressed="theme === option.id" :title="`${option.label} theme`" @click="theme = option.id">
            <span class="tswitch__dot" :class="`tswitch__dot--${option.id}`" />
            <span class="tswitch__label">{{ option.label }}</span>
        </button>
    </div>
</template>

<script setup>
const theme = useTheme()
const options = [
    { id: 'ivory', label: 'Ivory' },
    { id: 'ebony', label: 'Ebony' },
]
</script>

<style lang="scss">
.tswitch {
    display: inline-flex;
    padding: 3px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;

    button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        font-size: 13px;
        color: var(--text-2);
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;

        &.on {
            background: var(--ink);
            color: var(--ink-contrast);
        }

        &:not(.on):hover {
            color: var(--text);
        }
    }

    &__dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid var(--line-strong);

        &--ivory {
            background: #faf7f2;
        }

        &--ebony {
            background: #121212;
        }
    }

    @media (max-width: 560px) {
        &__label {
            display: none;
        }

        button {
            padding: 5px 7px;
        }
    }
}
</style>
