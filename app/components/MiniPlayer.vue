<template>
    <div v-if="current" class="mini" role="region" aria-label="Player">
        <input class="mini__seek" type="range" min="0" :max="duration || 0" step="0.1" :value="currentTime"
            :style="{ '--pct': `${pct}%` }" aria-label="Seek" @input="player.seek(Number($event.target.value))">

        <NuxtLink :to="openLink" class="mini__track" title="Open the player">
            <span class="mini__cover">
                <img v-if="current.hasCover" :src="`/api/tracks/${current.id}/cover`" alt="" draggable="false">
                <svg v-else viewBox="0 0 24 24" width="55%" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" /></svg>
            </span>
            <span class="mini__text">
                <strong>{{ current.title }}</strong>
                <small>{{ current.artist }}</small>
            </span>
        </NuxtLink>

        <div class="mini__controls">
            <button type="button" aria-label="Previous track" @click="player.go(-1)">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button type="button" class="mini__play" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="player.togglePlay">
                <svg v-if="!isPlaying" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
            </button>
            <button type="button" aria-label="Next track" @click="player.go(1)">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>
            </button>
        </div>

        <div class="mini__side">
            <span class="mini__time">{{ fmt(currentTime) }} / {{ fmt(duration) }}</span>
            <button type="button" class="mini__mode" :class="{ on: repeat !== 'off' }" :title="repeatLabel"
                :aria-label="repeatLabel" @click="player.cycleRepeat">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" /></svg>
                <b v-if="repeat === 'one'" class="mini__one">1</b>
            </button>
            <!-- The volume button opens the piano-key volume meter above the bar -->
            <div ref="volBox" class="mini__volume">
                <button type="button" :class="{ on: volOpen }" aria-label="Volume" :aria-expanded="volOpen"
                    @click="volOpen = !volOpen">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 5L6 9H3v6h3l5 4z" />
                        <path v-if="!muted && volume > 0" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
                        <path v-else d="M16 9l5 6M21 9l-5 6" />
                    </svg>
                </button>
                <div v-if="volOpen" class="mini__pop">
                    <VolumeControl v-model="volume" v-model:muted="muted" />
                </div>
            </div>
            <button type="button" aria-label="Close the player" title="Close" @click="player.stop">
                <AppIcon name="close" :size="18" />
            </button>
        </div>
    </div>
</template>

<script setup>
// The mini player: shown on every page except the Listen page, which has the full player.
// It is only a remote control for the shared player (see usePlayer).
const player = usePlayer()
const { current, isPlaying, currentTime, duration, repeat, repeatLabel, muted, volume, key, isList } = player

const volOpen = ref(false)
const volBox = ref(null)
function closeVolume(event) {
    if (event.type === 'keydown' ? event.key === 'Escape' : !volBox.value?.contains(event.target)) volOpen.value = false
}
onMounted(() => {
    document.addEventListener('pointerdown', closeVolume)
    document.addEventListener('keydown', closeVolume)
})
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', closeVolume)
    document.removeEventListener('keydown', closeVolume)
})

const pct = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0))
// A click on the track opens it in the full player, in the same list.
const openLink = computed(() => {
    const track = current.value?.id
    return isList.value ? { path: '/listener', query: { source: key.value, track } } : { path: '/listener', query: { track } }
})

function fmt(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
</script>

<style lang="scss">
.mini {
    position: sticky;
    bottom: 0;
    z-index: 40;
    display: flex;
    flex: none;
    align-items: center;
    gap: 16px;
    padding: 12px 18px 10px;
    border-top: 1px solid var(--line);
    background: var(--bg-elev);
    box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.12);
    text-align: left;

    /* the seek line along the top edge */
    &__seek {
        position: absolute;
        inset: -7px 0 auto;
        width: 100%;
        height: 14px;
        margin: 0;
        background: transparent;
        cursor: pointer;
        appearance: none;

        &::-webkit-slider-runnable-track {
            height: 3px;
            background: linear-gradient(to right, var(--accent) var(--pct), var(--line-strong) var(--pct));
        }

        &::-moz-range-track {
            height: 3px;
            background: var(--line-strong);
        }

        &::-moz-range-progress {
            height: 3px;
            background: var(--accent);
        }

        &::-webkit-slider-thumb {
            width: 0;
            height: 14px;
            appearance: none;
        }

        &:hover::-webkit-slider-thumb {
            width: 10px;
            border-radius: 50%;
            background: var(--accent);
        }

        &::-moz-range-thumb {
            width: 0;
            height: 0;
            border: 0;
        }
    }

    &__track {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 12px;
        min-width: 0;
        text-decoration: none;
        color: var(--text);
    }

    &__cover {
        display: grid;
        flex: none;
        place-items: center;
        width: 46px;
        height: 46px;
        overflow: hidden;
        border-radius: 8px;
        background: var(--bg-sunk);
        color: var(--text-3);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    &__text {
        display: flex;
        flex-direction: column;
        min-width: 0;

        strong,
        small {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        strong {
            font-size: 15px;
            font-weight: 500;
        }

        small {
            font-size: 13px;
            color: var(--text-2);
        }
    }

    &__controls,
    &__side {
        display: flex;
        flex: none;
        align-items: center;
        gap: 4px;
    }

    button {
        position: relative;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--text-2);
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
            background: var(--bg-sunk);
            color: var(--text);
        }
    }

    &__play {
        width: 44px !important;
        height: 44px !important;
        background: var(--ink) !important;
        color: var(--ink-contrast) !important;
    }

    &__mode.on,
    &__volume > button.on {
        color: var(--accent);
    }

    &__volume {
        position: relative;
    }

    /* the volume meter, opening upwards from the button */
    &__pop {
        position: absolute;
        right: -6px;
        bottom: calc(100% + 16px);
        padding: 10px 14px;
        border: 1px solid var(--line-strong);
        border-radius: 14px;
        background: var(--bg-elev);
        box-shadow: var(--shadow);
    }

    &__one {
        position: absolute;
        right: 6px;
        bottom: 5px;
        font-size: 9px;
        line-height: 1;
        color: var(--accent);
    }

    &__time {
        padding-right: 8px;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        color: var(--text-3);
    }
}

/* Phones: title, then the buttons; the time, repeat and mute go away to save room */
@media (max-width: 767px) {
    .mini {
        gap: 8px;
        padding: 10px 10px 8px;

        &__time,
        &__mode {
            display: none;
        }

        &__cover {
            width: 40px;
            height: 40px;
        }
    }
}
</style>
