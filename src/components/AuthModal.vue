<template>
    <div class="window">
        <div class="modal-content rounded-4 shadow">
            <div class="modal-header border-bottom-0">
                <h1 class="modal-title fs-5">{{ mode ? 'Log in' : 'Sign Up' }}</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" @click="close" aria-label="Close"></button>
            </div>
            <form @submit.prevent="formSubmit">
                <div class="form mb-3">
                    <label>Email address</label>
                    <input type="email" class="form-control rounded-3" id="floatingInput" placeholder="name@example.com"
                        v-model="form.email">
                </div>

                <div v-if="!mode" class="form mb-3">
                    <label>Username</label>
                    <input type="username" class="form-control rounded-3" id="floatingInput" placeholder="Username"
                        v-model="form.email">
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

<script>
import { mapActions } from 'vuex';

export default {
    name: 'AuthModal',
    props: {
        mode: Boolean,
    },
    data() {
        return {
            form: {
                email: '',
                password: '',
            }
        }
    },
        
    methods: {
        ...mapActions({
            setUser: 'user/setUser'
        }),
        close() {
            this.$emit('close');
        },
        formSubmit() {
            this.signIn()
        },
        async signIn() {
            try {
                const data = (await this.$api.auth.signIn({
                    email: this.form.email,
                    password: this.form.password
                })).data
                console.log(data)
                localStorage.setItem('user', JSON.stringify(data))
                this.setUser(data)
                this.$emit('close')
            } catch (error) {
                console.log(error)
            }
        },

    },
};
</script>

<style>
.window {
    display: block;
    padding: 20px;
}
</style>