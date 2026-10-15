<template>
    <section class="page soon">
        <span class="soon__icon"><AppIcon :name="icon" :size="34" /></span>
        <span class="soon__badge">Coming soon</span>
        <h1>{{ title }}</h1>
        <p class="soon__text">{{ text }}</p>
        <ul v-if="planned.length" class="soon__list">
            <li v-for="item in planned" :key="item">{{ item }}</li>
        </ul>
        <NuxtLink to="/listener" class="btn btn--solid">Back to listening</NuxtLink>
    </section>
</template>

<script setup>
defineProps({
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    planned: { type: Array, default: () => [] },
})
</script>

<style lang="scss">
.soon {
    display: flex;
    text-align: center;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding-top: clamp(50px, 12vh, 120px);

    &__icon {
        display: grid;
        place-items: center;
        width: 76px;
        height: 76px;
        border: 1px solid var(--line-strong);
        border-radius: 50%;
        background: var(--bg-elev);
        color: var(--accent);
    }

    &__badge {
        padding: 3px 12px;
        border-radius: 999px;
        background: var(--bg-sunk);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-2);
    }

    h1 {
        font-size: clamp(2.2rem, 6vw, 3.4rem);
    }

    &__text {
        max-width: 34em;
        margin: 0;
        color: var(--text-2);
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 4px 0 10px;
        color: var(--text-2);
        font-size: 15px;

        li::before {
            content: '·';
            margin-right: 8px;
            color: var(--accent);
        }
    }
}
</style>
