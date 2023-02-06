<template>
    <div id="player">
        <p>{{ current.artist }} - {{ current.song }}</p>
        <img src="@/assets/cover.png" alt="cover">
        <!-- <audio :class="song" src="./assets/music/Killswitch engage - Arms of Sorrow(piano ver.).mp3" ></audio> -->
        <div class="buttons">
            <img class="prev" src="@/assets/icon2.png" @click="prevSong()" alt="Previous">
            <img class="play" v-if="!isPlay" @click="playSong()" src="@/assets/icon1.png" alt="Play">
            <img class="pause" v-else @click="stopSong()" src="@/assets/icon4.png" alt="Pause">
            <img class="next" src="@/assets/icon3.png" @click="nextSong()" alt="Next ">
        </div>
    </div>
</template>


<script>

export default {
    name: 'MusicSection',
    el: '#player',
    data() {
        return {
            song: new Audio(),
            isPlay: false,
            current: {},
            index: 0,
            songs: [
                {
                    artist: 'Killswitch Engage',
                    song: 'Arms of Sorrow (piano ver.)',
                    src: require('@/assets/music/Killswitch engage - Arms of Sorrow(piano ver.).mp3')
                },
                {
                    artist: 'Killswitch Engage',
                    song: 'My curse (piano ver.)',
                    src: require('@/assets/music/Killswitch engage - My curse(piano ver.).mp3')
                },
                {
                    artist: 'Killswitch Engage',
                    song: 'Rose Of Sharyn (piano ver.)',
                    src: require('@/assets/music/Killswitch Engage - Rose Of Sharyn (Piano Cover).mp3')
                },
            ]
        }
    },
    components: {

    },
    created() {
        this.current = this.songs[this.index]
        this.song.src = this.current.src

    },
    methods: {
        playSong() {
            this.song.play()
            this.isPlay = true
        },
        stopSong() {
            this.song.pause()
            this.isPlay = false
        },
        nextSong() {
            if (this.songs.length-1 == this.index) {
                this.index = 0
                this.current = this.songs[this.index]
            } else {
                this.index = this.index + 1
                this.current = this.songs[this.index]
            }
            this.song.src = this.current.src
        },
        prevSong() {
            if (this.index == 0) {
                this.index = this.songs.length-1
                this.current = this.songs[this.index]
            } else {
                this.index = this.index - 1
                this.current = this.songs[this.index]
            }
            this.song.src = this.current.src
        },
    }
}

</script> 


<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital@1&display=swap');

#player {
    font-family: 'EB Garamond', serif;
    font-size: 20px;

    .play {
        cursor: pointer;
        margin: 20px;
    }

    .pause {
        cursor: pointer;
        margin: 20px;
    }

    .prev {
        cursor: pointer;
        margin: 20px;
    }

    .next {
        cursor: pointer;
        margin: 20px;
    }
}
</style>