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
                    <div class="text-end">
                        <button type="button" class="btn btn-outline-light me-2" @click="showLoginModal">Login</button>
                        <button type="button" class="btn btn-outline-light me-2" @click="showSignUpModal">Sign Up</button>

                    </div>
                </div>
            </div>
        </nav>
        <div>
            <Modal  v-show="isModalVisible" :mode="isLogin? true: false" @close="closeModal" />
        </div>
    </div>
</template>

<script>

import Modal from '@/components/LogInModal.vue';

export default {
    name: "HeadBar",
    components: {
        Modal,
    },
    data() {
        return {
            isModalVisible: false,
            isLogin: true,
        };
    },
    methods: {
        showLoginModal() {
            this.isLogin = true
            this.isModalVisible = true;
        },
        showSignUpModal(){
            this.isLogin = false
            this.isModalVisible = true;
        },
        closeModal() {
            this.isModalVisible = false;
        },
    },

}
</script>

<style lang="scss">
header {
    width: 100%;

}

#navbar {
    position: sticky;
}
</style>