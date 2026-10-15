<template>
    <aside class="comments" :class="{ 'comments--open': open }" aria-label="Comments">
        <header class="comments__head">
            <h3>Comments <span class="comments__count">{{ count }}</span></h3>
            <button type="button" class="comments__close" aria-label="Close comments" @click="emit('close')">&times;</button>
        </header>

        <form v-if="user" class="comments__form" @submit.prevent="send">
            <span class="avatar" :style="avatarStyle(user.username)">{{ initial(user.username) }}</span>
            <input ref="input" v-model="draft" type="text" maxlength="2000" :placeholder="`Comment as ${user.username}…`"
                aria-label="Write a comment">
            <button type="submit" :disabled="!draft.trim() || sending">Send</button>
        </form>
        <div v-else class="comments__cta">
            <p>Join the conversation about this track.</p>
            <div>
                <button type="button" @click="openAuth(true)">Log in</button>
                <button type="button" class="ghost" @click="openAuth(false)">Sign up</button>
            </div>
        </div>
        <p v-if="error" class="comments__error" role="alert">{{ error }}</p>

        <ul class="comments__list">
            <li v-for="c in comments" :key="c.id">
                <span class="avatar" :style="avatarStyle(c.name)">{{ initial(c.name) }}</span>
                <div>
                    <p class="comments__meta"><strong>{{ c.name }}</strong> <time>{{ ago(c.created_at) }}</time></p>
                    <p class="comments__text">{{ c.comment }}</p>
                </div>
            </li>
            <li v-if="!loading && !comments.length" class="comments__empty">
                No comments yet. Be the first to say something!
            </li>
        </ul>
    </aside>
</template>

<script setup>
const props = defineProps({
    trackId: { type: Number, required: true },
    count: { type: Number, default: 0 },
    open: Boolean,
})
const emit = defineEmits(['close', 'added'])

const api = useApi()
const user = useUser()
const comments = ref([])
const draft = ref('')
const loading = ref(true)
const sending = ref(false)
const error = ref('')
const input = ref(null)

let requestId = 0
async function load() {
    const mine = ++requestId
    loading.value = true
    error.value = ''
    comments.value = []
    try {
        const list = await api.tracks.comments(props.trackId)
        if (mine === requestId) comments.value = list
    } catch (e) {
        if (mine === requestId) error.value = 'Could not load comments.'
    } finally {
        if (mine === requestId) loading.value = false
    }
}
watch(() => props.trackId, load, { immediate: true })

async function send() {
    const text = draft.value.trim()
    if (!text || sending.value) return
    sending.value = true
    error.value = ''
    try {
        const added = await api.tracks.addComment(props.trackId, { comment: text })
        comments.value.unshift(added)
        draft.value = ''
        emit('added')
    } catch (e) {
        error.value = e.data?.statusMessage || 'Could not send your comment.'
    } finally {
        sending.value = false
    }
}

function focusInput() {
    input.value?.focus()
}
defineExpose({ focusInput })

const initial = (name) => (name || '?').trim().charAt(0).toUpperCase()
function avatarStyle(name) {
    let h = 0
    for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) % 360
    return { background: `hsl(${h} 45% 38%)` }
}
function ago(ts) {
    const s = Math.max(0, Math.floor(Date.now() / 1000) - ts)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)} min ago`
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`
    return `${Math.floor(s / 86400)} d ago`
}
</script>

<style lang="scss">
.comments {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
    text-align: left;
    color: var(--text);
    background: var(--glass);
    backdrop-filter: blur(18px);
    border: 1px solid var(--glass-line);
    border-radius: 18px;
    box-shadow: var(--shadow);

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;

        h3 {
            margin: 0;
            font-size: 28px;
        }
    }

    &__count {
        display: inline-block;
        min-width: 24px;
        margin-left: 4px;
        padding: 1px 8px;
        border-radius: 999px;
        background: var(--accent);
        font-family: var(--font-ui);
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        vertical-align: middle;
        color: var(--accent-ink);
    }

    &__close {
        display: none;
        border: 0;
        background: none;
        font-size: 30px;
        line-height: 1;
        color: var(--text-2);
        cursor: pointer;
    }

    &__form {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;

        input {
            flex: 1;
            min-width: 0;
            padding: 10px 14px;
            border: 1px solid var(--line-strong);
            border-radius: 999px;
            outline: none;
            background: var(--bg-sunk);
            color: var(--text);

            &::placeholder {
                color: var(--text-3);
            }

            &:focus {
                border-color: var(--accent);
            }
        }

        button {
            padding: 9px 16px;
            border: 0;
            border-radius: 999px;
            background: var(--ink);
            font-weight: 500;
            color: var(--ink-contrast);
            cursor: pointer;

            &:disabled {
                opacity: 0.4;
                cursor: default;
            }
        }
    }

    &__cta {
        margin-bottom: 14px;
        padding: 14px;
        border-radius: 14px;
        background: var(--bg-sunk);
        text-align: center;

        p {
            margin: 0 0 10px;
            font-size: 14px;
            color: var(--text-2);
        }

        button {
            margin: 0 4px;
            padding: 8px 18px;
            border: 1px solid var(--ink);
            border-radius: 999px;
            background: var(--ink);
            font-weight: 500;
            color: var(--ink-contrast);
            cursor: pointer;

            &.ghost {
                background: transparent;
                color: var(--text);
            }
        }
    }

    &__error {
        margin: 0 0 10px;
        font-size: 13px;
        color: var(--danger);
    }

    &__list {
        flex: 1;
        min-height: 0;
        margin: 0;
        padding: 0 4px 0 0;
        overflow-y: auto;
        list-style: none;
        overscroll-behavior: contain;

        li {
            display: flex;
            gap: 10px;
            padding: 12px 0;
            border-top: 1px solid var(--line);
            overflow-wrap: anywhere;
        }
    }

    &__meta {
        margin: 0 0 2px;
        font-size: 13px;

        time {
            margin-left: 6px;
            color: var(--text-3);
            font-size: 12px;
        }
    }

    &__text {
        margin: 0;
        font-size: 15px;
        line-height: 1.4;
    }

    &__empty {
        display: block !important;
        color: var(--text-2);
        text-align: center;
    }

    .avatar {
        display: grid;
        flex: none;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
    }
}

// Phones: the panel becomes a bottom sheet opened from the comment button.
@media (max-width: 959px) {
    .comments {
        position: fixed;
        inset: auto 0 0 0;
        z-index: 30;
        max-height: 72dvh;
        height: 72dvh;
        border-radius: 22px 22px 0 0;
        background: var(--bg-elev);
        transform: translateY(105%);
        transition: transform 0.3s ease;

        &--open {
            transform: translateY(0);
        }

        &__close {
            display: block;
        }
    }
}
</style>
