<template>
    <Teleport to="body">
        <Transition name="auth" :duration="200">
            <div v-if="open" class="auth-backdrop" @mousedown.self="close">
                <div class="auth-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
                    <button type="button" class="auth-close" aria-label="Close" @click="close">&times;</button>

                    <h2 :id="titleId" class="auth-title">{{ mode ? 'Welcome back' : 'Create account' }}</h2>
                    <p class="auth-subtitle">
                        {{ mode ? 'Log in to leave comments under your name.' : 'Join to comment on songs under your own name.' }}
                    </p>

                    <div class="auth-tabs" role="tablist">
                        <button type="button" role="tab" :aria-selected="mode" :class="{ active: mode }"
                            @click="mode || switchMode()">Log in</button>
                        <button type="button" role="tab" :aria-selected="!mode" :class="{ active: !mode }"
                            @click="mode && switchMode()">Sign up</button>
                    </div>

                    <form novalidate @submit.prevent="submit">
                        <div class="auth-field">
                            <label for="auth-email">Email address</label>
                            <input id="auth-email" ref="emailInput" v-model.trim="form.email" type="email"
                                autocomplete="email" placeholder="name@example.com"
                                :class="{ invalid: errors.email }">
                            <small v-if="errors.email" class="auth-error">{{ errors.email }}</small>
                        </div>

                        <div v-if="!mode" class="auth-field">
                            <label for="auth-username">Username <span class="optional">(optional)</span></label>
                            <input id="auth-username" v-model.trim="form.username" type="text"
                                autocomplete="username" placeholder="How your name appears">
                        </div>

                        <div class="auth-field">
                            <label for="auth-password">Password</label>
                            <div class="auth-password">
                                <input id="auth-password" v-model="form.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    :autocomplete="mode ? 'current-password' : 'new-password'"
                                    placeholder="At least 6 characters" :class="{ invalid: errors.password }">
                                <button type="button" class="auth-toggle" @click="showPassword = !showPassword">
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                            <small v-if="errors.password" class="auth-error">{{ errors.password }}</small>
                        </div>

                        <p v-if="serverError" class="auth-alert" role="alert">{{ serverError }}</p>

                        <button type="submit" class="auth-submit" :disabled="loading">
                            {{ loading ? 'Please wait…' : mode ? 'Log in' : 'Create account' }}
                        </button>
                    </form>

                    <p class="auth-switch">
                        {{ mode ? 'No account yet?' : 'Already registered?' }}
                        <button type="button" @click="switchMode">{{ mode ? 'Sign up' : 'Log in' }}</button>
                    </p>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
const props = defineProps({
    open: Boolean,
    // true = log in, false = sign up
    mode: Boolean,
})
const emit = defineEmits(['close', 'switch'])

const api = useApi()
const titleId = useId()
const emailInput = ref(null)
const form = reactive({ email: '', username: '', password: '' })
const errors = reactive({ email: '', password: '' })
const serverError = ref('')
const loading = ref(false)
const showPassword = ref(false)

function reset() {
    Object.assign(form, { email: '', username: '', password: '' })
    Object.assign(errors, { email: '', password: '' })
    serverError.value = ''
    showPassword.value = false
}
function close() {
    if (loading.value) return
    emit('close')
}
function switchMode() {
    Object.assign(errors, { email: '', password: '' })
    serverError.value = ''
    emit('switch')
}
function validate() {
    errors.email = /^\S+@\S+\.\S+$/.test(form.email) ? '' : 'Enter a valid email address'
    errors.password = form.password.length >= 6 ? '' : 'Password must be at least 6 characters'
    return !errors.email && !errors.password
}
async function submit() {
    serverError.value = ''
    if (!validate()) return
    loading.value = true
    try {
        const user = props.mode
            ? await api.auth.signIn({ email: form.email, password: form.password })
            : await api.auth.signUp({ email: form.email, username: form.username, password: form.password })
        setUser(user)
        emit('close')
    } catch (error) {
        serverError.value = error.data?.statusMessage || 'Something went wrong. Please try again.'
    } finally {
        loading.value = false
    }
}

function onKeydown(event) {
    if (event.key === 'Escape') close()
}

watch(() => props.open, async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
        window.addEventListener('keydown', onKeydown)
        await nextTick()
        emailInput.value?.focus()
    } else {
        window.removeEventListener('keydown', onKeydown)
        reset()
    }
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
})
</script>

<style lang="scss">
$gold: #9b7c27;

.auth-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(10, 10, 10, 0.65);
    backdrop-filter: blur(4px);
}

.auth-dialog {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 36px 32px 28px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
    text-align: left;

    .auth-close {
        position: absolute;
        top: 10px;
        right: 14px;
        border: 0;
        background: none;
        font-size: 28px;
        line-height: 1;
        color: #777;
        cursor: pointer;

        &:hover {
            color: #111;
        }
    }

    .auth-title {
        margin: 0 0 4px;
        font-family: 'Aboreto', cursive;
        font-size: 26px;
        text-align: center;
        color: $gold;
    }

    .auth-subtitle {
        margin: 0 0 20px;
        text-align: center;
        font-size: 14px;
        color: #666;
    }

    .auth-tabs {
        display: flex;
        margin-bottom: 20px;
        padding: 4px;
        background: #efefef;
        border-radius: 10px;

        button {
            flex: 1;
            padding: 8px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            font-weight: 600;
            color: #666;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;

            &.active {
                background: #222;
                color: #fff;
            }
        }
    }

    .auth-field {
        margin-bottom: 14px;

        label {
            display: block;
            margin-bottom: 4px;
            font-size: 13px;
            font-weight: 600;
            color: #333;
        }

        .optional {
            font-weight: 400;
            color: #888;
        }

        input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;

            &:focus {
                border-color: $gold;
                box-shadow: 0 0 0 3px rgba($gold, 0.25);
            }

            &.invalid {
                border-color: #c0392b;
            }
        }
    }

    .auth-password {
        position: relative;

        input {
            padding-right: 64px;
        }

        .auth-toggle {
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            border: 0;
            background: none;
            font-size: 13px;
            color: $gold;
            cursor: pointer;
        }
    }

    .auth-error {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #c0392b;
    }

    .auth-alert {
        margin: 0 0 12px;
        padding: 8px 12px;
        border-radius: 8px;
        background: #fdecea;
        font-size: 13px;
        color: #a93226;
    }

    .auth-submit {
        width: 100%;
        padding: 11px;
        border: 0;
        border-radius: 8px;
        background: #222;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;

        &:hover:not(:disabled) {
            background: $gold;
        }

        &:disabled {
            opacity: 0.6;
            cursor: wait;
        }
    }

    .auth-switch {
        margin: 16px 0 0;
        text-align: center;
        font-size: 14px;
        color: #666;

        button {
            border: 0;
            background: none;
            font-weight: 600;
            color: $gold;
            cursor: pointer;
        }
    }
}

.auth-enter-active,
.auth-leave-active {
    transition: opacity 0.2s ease;

    .auth-dialog {
        transition: transform 0.2s ease;
    }
}

.auth-enter-from,
.auth-leave-to {
    opacity: 0;

    .auth-dialog {
        transform: translateY(12px) scale(0.97);
    }
}
</style>
