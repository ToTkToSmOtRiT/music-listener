<template>
    <div id="player">
        <p>{{ current.artist }} - {{ current.song }}</p>
        <img src="~/assets/cover.png" alt="cover">
        <div class="buttons">
            <img class="prev" src="~/assets/icon2.png" @click="prevSong()" alt="Previous" role="button" tabindex="0" @keydown.enter="prevSong()">
            <img class="play" v-if="!isPlay" @click="playSong()" src="~/assets/icon1.png" alt="Play" role="button" tabindex="0" @keydown.enter="playSong()">
            <img class="pause" v-else @click="stopSong()" src="~/assets/icon4.png" alt="Pause" role="button" tabindex="0" @keydown.enter="stopSong()">
            <img class="next" src="~/assets/icon3.png" @click="nextSong()" alt="Next" role="button" tabindex="0" @keydown.enter="nextSong()">
        </div>
    </div>

    <div id="comments-section">
        <h3>Comments</h3>
        <div class="adding-com">
            <form @submit.prevent="sendComment">
                <input class="comment" type="text" placeholder="Write your comment..." v-model="newComment">
                <button type="submit">Send</button>
            </form>
        </div>
        <div class="coms">
            <ul>
                <li v-for="coms in current.comments" :key="coms.id">
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


<script setup>
const api = useApi()
const user = useUser()

let song = null
const isPlay = ref(false)
const current = ref({})
const index = ref(0)
const songs = ref([])
const newComment = ref('')

onMounted(getSongs)
onBeforeUnmount(releaseAudio)

function playSong() {
    if (!song) return
    song.play().then(() => {
        isPlay.value = true
    }).catch((error) => console.error('Playback failed', error.message))
}
function stopSong() {
    if (!song) return
    song.pause()
    isPlay.value = false
}
function changeSong(step) {
    if (!songs.value.length) return
    const wasPlaying = isPlay.value
    index.value = (index.value + step + songs.value.length) % songs.value.length
    current.value = songs.value[index.value]
    loadAudio()
    if (wasPlaying) playSong()
}
const nextSong = () => changeSong(1)
const prevSong = () => changeSong(-1)

function releaseAudio() {
    if (!song) return
    song.pause()
    song.onended = null
    song = null
    isPlay.value = false
}
function loadAudio() {
    releaseAudio()
    song = new Audio(encodeURI(`/${current.value.src}`))
    song.onended = () => changeSong(1)
}
async function getSongs() {
    try {
        songs.value = await api.loader.loadSongs()
        current.value = songs.value[index.value] || {}
        if (current.value.src) loadAudio()
    } catch (error) {
        console.error(error)
    }
}
async function sendComment() {
    const comment = newComment.value.trim()
    if (!comment || current.value.id === undefined) return
    try {
        const added = await api.loader.addComment(current.value.id, {
            name: user.value ? user.value.username || user.value.email : 'Anonymous',
            comment,
        })
        current.value.comments.push(added)
        newComment.value = ''
    } catch (error) {
        console.error('Failed to send comment', error.message)
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


