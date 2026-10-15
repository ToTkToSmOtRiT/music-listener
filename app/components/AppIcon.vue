<template>
    <svg class="icon" viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-for="d in paths" :key="d" :d="d" />
    </svg>
</template>

<script setup>
const props = defineProps({
    name: { type: String, required: true },
    size: { type: [Number, String], default: 22 },
})

const ICONS = {
    home: ['M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z'],
    listen: ['M4 16v-4a8 8 0 0116 0v4', 'M4 15h3v5H5a1 1 0 01-1-1zM20 15h-3v5h2a1 1 0 001-1z'],
    collection: ['M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z'],
    feed: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
    news: ['M5 4h11a1 1 0 011 1v15H6a2 2 0 01-2-2V5a1 1 0 011-1z', 'M17 9h3v9a2 2 0 01-2 2', 'M8 8h6M8 12h6M8 16h4'],
    subscriptions: ['M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 01-3.4 0'],
    playlist: ['M3 6h13M3 12h9M3 18h7', 'M21 16V5l-6 1.5V17', 'M12.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'],
    menu: ['M4 6h16M4 12h16M4 18h16'],
    close: ['M6 6l12 12M18 6L6 18'],
    sun: ['M12 17a5 5 0 100-10 5 5 0 000 10z', 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
    moon: ['M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z'],
    login: ['M15 3h4a1 1 0 011 1v16a1 1 0 01-1 1h-4', 'M10 17l5-5-5-5M15 12H3'],
    logout: ['M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4', 'M16 17l5-5-5-5M21 12H9'],
    user: ['M20 21a8 8 0 10-16 0', 'M12 12a4 4 0 100-8 4 4 0 000 8z'],
}

const paths = computed(() => ICONS[props.name] ?? [])
</script>
