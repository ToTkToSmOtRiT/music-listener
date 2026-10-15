<template>
    <ComingSoon icon="feed" title="Feed"
        text="A single stream of what the artists and listeners you follow are posting."
        :planned="['New tracks from artists you follow', 'Comments and likes from people you follow']" />
</template>

<script setup>
useHead({ title: 'Feed - Music listener' })
</script>
