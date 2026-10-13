<template>
    <div class="window">
        <div class="modal-content rounded-4 shadow">
            <div class="modal-header border-bottom-0">
                <h1 class="modal-title fs-5">{{ mode ? 'Log in' : 'Sign Up' }}</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" @click="close" aria-label="Close"></button>
            </div>
            <form @submit.prevent="mode ? signIn() : signUp()">
                <div class="form mb-3">
                    <label>Email address</label>
                    <input type="email" class="form-control rounded-3" id="emailInput" placeholder="name@example.com"
                        v-model="form.email">
                </div>

                <div v-if="!mode" class="form mb-3">
                    <label>Username</label>
                    <input type="text" class="form-control rounded-3" id="usernameInput" placeholder="Username"
                        v-model="form.username">
                </div>

                <div class="form mb-3">
                    <label>Password</label>
                    <input type="password" class="form-control rounded-3" id="floatingPassword" placeholder="Password"
                        v-model="form.password">
                </div>

                <div class="modal-footer flex-column border-top-0">
                    <button type="submit" class="btn btn-dark">{{ mode ? 'Log in' : 'Sign Up' }}</button>
                    <button type="button" class="btn btn-dark" @click="close" data-bs-dismiss="modal">Close</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
defineProps({ mode: Boolean })
const emit = defineEmits(['close'])

const api = useApi()
const form = reactive({ email: '', username: '', password: '' })

function resetForm() {
    Object.assign(form, { email: '', username: '', password: '' })
}
function close() {
    resetForm()
    emit('close')
}
function finish(user) {
    setUser(user)
    resetForm()
    emit('close')
}
async function signIn() {
    try {
        finish(await api.auth.signIn({ email: form.email, password: form.password }))
    } catch (error) {
        console.error('Sign in failed', error.message)
    }
}
async function signUp() {
    try {
        finish(await api.auth.signUp({
            email: form.email,
            username: form.username,
            password: form.password
        }))
    } catch (error) {
        console.error('Sign up failed', error.message)
    }
}
</script>

<style>
.window {
    display: block;
    padding: 20px;
}
</style>


