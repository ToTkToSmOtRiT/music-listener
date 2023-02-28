<template>
    <div>
        <!-- <router-link to="/">Home</router-link> -->
        <div id="music-section">
            <h1>Music listener</h1>
            <MusicSection />
        </div>
        <CommentsSection />
    </div>
</template>

<script>
import MusicSection from '@/components/MusicSection.vue';
import CommentsSection from '@/components/CommentsSection.vue';

export default {
    name: 'App',
    components: {
        MusicSection,
        CommentsSection
    }
}
</script>

<style>
#music-section {
    position: relative;
    padding-top: 50px;
    height: 600px;
}
</style>