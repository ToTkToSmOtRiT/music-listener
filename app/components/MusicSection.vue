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
            <form v-if="user" @submit.prevent="sendComment">
                <input class="comment" type="text" placeholder="Write your comment..." v-model="newComment">
                <button type="submit">Send</button>
            </form>
        <p v-if="!user" class="login-hint">Log in or sign up to join the conversation.</p></div>
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
    padding: 0 16px;
    font-family: 'EB Garamond', serif;
    font-size: clamp(16px, 2.5vw, 20px);

    > img {
        display: block;
        width: 100%;
        max-width: 348px;
        height: auto;
        margin: 0 auto;
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(16px, 5vw, 40px);
        margin: 20px 0;

        img {
            cursor: pointer;
        }
    }
}

#comments-section {
    max-width: 800px;
    margin: clamp(40px, 8vw, 100px) auto;
    padding: 0 16px;

    h3 {
        font-family: 'Aboreto', cursive;
        font-size: 20px;
        margin: 20px 0;
    }

    form {
        display: flex;
        gap: 8px;
        margin-bottom: 30px;

        .comment {
            flex: 1;
            min-width: 0;
            padding: 6px 10px;
            border: none;
            border-bottom: 1px solid #ccc;
            outline: none;
            background-color: transparent;
        }

        button {
            padding: 6px 14px;
            border: 1px solid #999;
            background-color: transparent;
        }
    }

    .coms {
        ul {
            margin: 0;
            padding: 0;
        }

        li {
            list-style: none;
            margin-bottom: 30px;
            text-align: left;
            overflow-wrap: anywhere;

            span {
                font-weight: 700;
            }
        }
    }
}

#comments-section .login-hint {
    margin: 0;
    font-size: 14px;
    color: #777;
}
</style>


