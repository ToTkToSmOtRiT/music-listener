<template>
    <div id="navbar">
        <nav class="navbar navbar-expand navbar-dark bg-dark" aria-label="Second navbar example">
            <div class="container-fluid">

                <div class="collapse navbar-collapse" id="navbarsExample02">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <RouterLink class="nav-link" to="/">Home</RouterLink>
                        </li>
                        <li class="nav-item">
                            <RouterLink class="nav-link" to="/listener">Listen</RouterLink>
                        </li>
                    </ul>
                    <div v-if="getUser" class="text-end">
                        <button type="button" class="btn btn-outline-light me-2" @click="changeUserState">Logout</button>
                    </div>

                    <div v-else>
                        <button type="button" class="btn btn-outline-light me-2" @click="showLoginModal">Login</button>
                        <button type="button" class="btn btn-outline-light me-2" @click="showSignUpModal">Sign Up</button>
                    </div>
                </div>
            </div>
        </nav>
        <div>
            <Modal v-show="isModalVisible" :mode="isLogin ? true : false" @close="closeModal" />
        </div>
    </div>
</template>

<script>

import Modal from '@/components/AuthModal.vue';
// import { useStore } from 'vuex'
import { mapActions, mapGetters } from 'vuex';

export default {
    name: "HeadBar",
    components: {
        Modal,
    },
    // store() {
    //     const store = useStore()
    //     console.log(store.state.user)
    // },
    data() {
        return {
            isModalVisible: false,
            isLogin: true,
            auth: false,
        };
    },
    computed: {
        ...mapGetters({
            getUser: 'user/getUser'
        }),
    },
    created() {
        this.auth = localStorage.getItem('user') !== null
        this.setUser(JSON.parse(localStorage.getItem('user')))
    },

    methods: {
        ...mapActions({
            setUser: 'user/setUser',
            deleteUser: 'user/deleteUser'
        }),

        showLoginModal() {
            this.isLogin = true
            this.isModalVisible = true;
        },
        showSignUpModal() {
            this.isLogin = false
            this.isModalVisible = true;
        },
        closeModal() {
            this.isModalVisible = false;
        },
        // logout() {
        //     this.auth = false
        // },
        changeUserState() {
            // if (this.auth) {
            //     if (this.isModalVisible)
            //         this.closeModal()
            //     localStorage.setItem('auth', false)
            //     this.auth = false
            // } else {
            //     localStorage.setItem('auth', true)
            //     this.auth = true
            // }
            if (this.getUser) {
                this.$api.auth.logout()
                localStorage.removeItem('user')
                this.deleteUser()
                localStorage.setItem('auth', false)
                this.auth = false
            }
        }

    },

}
</script>

<style lang="scss">
header {
    width: 100%;
}

// #navbar {
//     position: sticky;
// }
</style>