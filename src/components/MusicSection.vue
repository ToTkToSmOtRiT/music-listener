<template>
    <div id="player">
        <p>Killswitch engage - Arms of Sorrow(piano ver.).mp3</p>
        <!-- <audio :class="song" src="./assets/music/Killswitch engage - Arms of Sorrow(piano ver.).mp3" ></audio> -->
        <div class="buttons">
            <img class="prev" src="@/assets/icon2.png" alt="Previous">
            <img class="play" @click="playSong('assets/music/Killswitch engage - Arms of Sorrow(piano ver.).mp3')"
                src="@/assets/icon1.png" alt="Play">
            <img class="next" src="@/assets/icon3.png" alt="Next ">
        </div>
    </div>
</template>


<script>

export default {
    name: 'MusicSection',
    el: '#player',
    components: {

    },
    methods: {
        playSong(song) {
            if (song) {
                var audio = new Audio(song)
                audio.play()
            }
        },
        stopSong() {

        }
    }
}

</script> 


<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital@1&display=swap');
#player{
    font-family: 'EB Garamond', serif;
    font-size: 20px;
    .play{
        cursor: pointer;
        margin: 20px;
    }
    .prev{
        cursor: pointer;
        margin: 20px;
    }
    .next{
        cursor: pointer;
        margin: 20px;
    }
}
</style>