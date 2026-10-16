<template>
    <div class="fy">
        <label class="fy__switch">
            <input type="checkbox" :checked="profile?.enabled !== false" :disabled="busy || !profile"
                @change="toggle($event.target.checked)">
            <span class="fy__track" aria-hidden="true" />
            <span>Personalise my Listen feed</span>
        </label>
        <p v-if="profile && !profile.enabled" class="fy__note">
            It is off: nothing is learned and the Listen tab shows random tracks. What it learned before is kept until
            you reset it.
        </p>

        <section v-if="profile" class="fy__learned" aria-label="What it has learned">
            <h3>What it has learned</h3>
            <p v-if="!profile.plays && !profile.genres.length" class="fy__note">
                Nothing yet. Listen, skip and like a few tracks and it will start to adapt.
            </p>
            <p v-else-if="profile.learning" class="fy__note">
                Still learning ({{ profile.plays }} plays so far). Picks are mostly random until it has seen a few more.
            </p>

            <template v-if="profile.genres.length">
                <p class="fy__label">Genres you lean towards</p>
                <ul class="fy__chips">
                    <li v-for="g in profile.genres" :key="g.key">{{ g.label }}</li>
                </ul>
            </template>
            <template v-if="profile.artists.length">
                <p class="fy__label">Artists you play most</p>
                <ul class="fy__chips">
                    <li v-for="a in profile.artists" :key="a.key">{{ a.label }}</li>
                </ul>
            </template>
            <p v-if="profile.plays" class="fy__note">
                Based on your last 90 days ({{ profile.plays }} plays); older listening counts less and less.
            </p>
        </section>

        <p v-if="error" class="fy__error" role="alert">{{ error }}</p>

        <button type="button" class="btn btn--ghost fy__reset" :class="{ armed: confirming }"
            :disabled="busy || !profile || (!profile.plays && !profile.genres.length)" @click="reset">
            {{ confirming ? 'Click again to forget everything' : 'Reset my taste profile' }}
        </button>
    </div>
</template>

<script setup>
// The "For you" controls: the on/off switch, what it has learned and the reset.
// Shown in the player's settings window and in Profile > Settings.
const emit = defineEmits(['changed'])

const api = useApi()
const profile = ref(null)
const busy = ref(false)
const error = ref('')
const confirming = ref(false)

let confirmTimer
async function load() {
    error.value = ''
    try {
        profile.value = await api.foryou.profile()
    } catch (e) {
        error.value = 'Could not load your profile.'
    }
}

async function toggle(enabled) {
    busy.value = true
    error.value = ''
    try {
        profile.value = await api.foryou.setEnabled(enabled)
        emit('changed')
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not change that.'
        await load()
    } finally {
        busy.value = false
    }
}

async function reset() {
    if (!confirming.value) {
        confirming.value = true
        clearTimeout(confirmTimer)
        confirmTimer = setTimeout(() => { confirming.value = false }, 4000)
        return
    }
    busy.value = true
    confirming.value = false
    error.value = ''
    try {
        profile.value = await api.foryou.reset()
        emit('changed')
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not reset.'
    } finally {
        busy.value = false
    }
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(confirmTimer))
</script>

<style lang="scss">
.fy {
    text-align: left;

    &__switch {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 4px 0 8px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;

        input {
            position: absolute;
            opacity: 0;
        }
    }

    &__track {
        position: relative;
        flex: none;
        width: 42px;
        height: 24px;
        border-radius: 999px;
        background: var(--line-strong);
        transition: background-color 0.2s;

        &::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--bg-elev);
            transition: transform 0.2s;
        }
    }

    &__switch input:checked + &__track {
        background: var(--accent);

        &::after {
            transform: translateX(18px);
            background: var(--accent-ink);
        }
    }

    &__switch input:focus-visible + &__track {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    &__note {
        margin: 6px 0 0;
        font-size: 13px;
        color: var(--text-2);
    }

    &__error {
        margin: 10px 0 0;
        font-size: 13px;
        color: var(--danger);
    }

    &__learned {
        margin: 18px 0 4px;
        padding-top: 14px;
        border-top: 1px solid var(--line);

        h3 {
            margin-bottom: 4px;
            font-size: 22px;
        }
    }

    &__label {
        margin: 12px 0 6px;
        font-size: 13px;
        color: var(--text-2);
    }

    &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        li {
            padding: 4px 12px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            background: var(--bg-sunk);
            font-size: 13px;
        }
    }

    &__reset {
        width: 100%;
        margin-top: 16px;

        &.armed {
            border-color: var(--danger);
            color: var(--danger);
        }

        &:disabled {
            opacity: 0.4;
            cursor: default;
        }
    }
}
</style>
