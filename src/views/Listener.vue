<template>
    <div>
        <!-- <router-link to="/">Home</router-link> -->
        <div id="music-section">
            <h1>Music listener</h1>
            <MusicSection />
        </div>
        <!-- <LikeOrNot /> -->
        <CommentsSection />
    </div>
</template>

<script>
import MusicSection from '@/components/MusicSection.vue';
// import LikeOrNot from '@/components/LikeOrNotSection.vue';
import CommentsSection from '@/components/CommentsSection.vue';

export default {
    name: 'App',
    components: {
        MusicSection,
        // LikeOrNot,
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