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

    <div id="comments-section">
        <h3>Comments</h3>
        <div class="adding-com">
            <form action="">
                <input class="comment" type="text" placeholder="Write your comment...">
                <button type="submit">Send</button>
            </form>
        </div>
        <div class="coms">
            <ul>
                <li v-for="coms in current.comments" :key="coms">
                    <span>{{ coms.name }}</span>
                    <br>
                    <p>
                        {{ coms.comment }}
                    </p>
                </li>
            </ul>
        </div>
    </div>
</template>


<script>
// import {toRaw} from 'vue'

export default {
    name: 'MusicSection',
    el: '#player',
    data() {
        return {
            song: undefined,
            isPlay: false,
            current: {},
            index: 0,
            songs: [
                {
                    "id": 0,
                    "artist": "",
                    "song": "",
                    "src": "",
                    "comments": []
                }
            ],
        }
    },
    components: {

    },
    created() {
        this.getSongs()    
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
            if (this.songs.length - 1 == this.index) {
                this.index = 0
                this.current = this.songs[this.index]
            } else {
                this.index = this.index + 1
                this.current = this.songs[this.index]
            }
            this.song.src = this.getUrl(this.current.src)
        },
        prevSong() {
            if (this.index == 0) {
                this.index = this.songs.length - 1
                this.current = this.songs[this.index]
            } else {
                this.index = this.index - 1
                this.current = this.songs[this.index]
            }
            this.song.src = this.getUrl(this.current.src)
        },
        getUrl(song){
            return require('../assets/'+song)
        },
        async getSongs() {
            try {
                const data = (await this.$api.loader.loadSongs()).data
                this.songs = data
                this.current = this.songs[this.index]
                this.song = new Audio(this.getUrl(this.current.src))
            } catch (error) {
                console.log(error)
            }
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

#comments-section {
    // background: linear-gradient(#afafaf, transparent);
    margin: 100px 0px;

    .adding-com {
        height: 50px;

        input {
            border: none;
            outline: none;
        }
    }

    h3 {
        font-family: 'Aboreto', cursive;
        font-size: 20px;
        margin: 20px 0px;
    }

    form {
        .comment {
            border: none;
            background-color: transparent;
        }

        button {
            background-color: transparent;
        }
    }

    .coms {
        margin: 100px;
        padding: 0px 250px;
        text-align: justify;

        li {
            list-style: none;
            margin: 10px;
            margin-bottom: 30px;

            span {
                font-weight: 700;
            }
        }
    }
}
</style>