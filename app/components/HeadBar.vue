<template>
    <div id="navbar">
        <nav class="navbar navbar-expand navbar-dark bg-dark" aria-label="Second navbar example">
            <div class="container-fluid">

                <div class="collapse navbar-collapse" id="navbarsExample02">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <NuxtLink class="nav-link" to="/">Home</NuxtLink>
                        </li>
                        <li class="nav-item">
                            <NuxtLink class="nav-link" to="/listener">Listen</NuxtLink>
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
            <AuthModal v-show="isModalVisible" :mode="isLogin" @close="closeModal" />
        </div>
    </div>
</template>

<script setup>
const api = useApi()
const getUser = useUser()
const isModalVisible = ref(false)
const isLogin = ref(true)

onMounted(loadStoredUser)

function showLoginModal() {
    isLogin.value = true
    isModalVisible.value = true
}
function showSignUpModal() {
    isLogin.value = false
    isModalVisible.value = true
}
function closeModal() {
    isModalVisible.value = false
}
async function changeUserState() {
    if (!getUser.value) return
    clearUser()
    try {
        await api.auth.logout()
    } catch (error) {
        console.error('Logout request failed', error.message)
    }
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


