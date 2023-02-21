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
                        <button type="button" class="btn btn-outline-light me-2" @click="showModal">Login</button>
                        <button type="button" class="btn btn-outline-light me-2">Sign-up</button>
                    </div>
                </div>
            </div>
        </nav>
        <LogInModal v-show="isModalVisible" @close="closeModal" />
    </div>
</template>

<script>

import LogInModal from '@/components/LogInModal.vue';

export default {
    name: "HeadBar",
    components: {
        LogInModal,
    },
    data() {
        return {
            isModalVisible: false,
        };
    },
    methods: {
        showModal() {
            this.isModalVisible = true;
        },
        closeModal() {
            this.isModalVisible = false;
        }
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