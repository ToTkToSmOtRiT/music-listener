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
        <AuthModal :open="isModalVisible" :mode="isLogin" @close="closeModal" @switch="isLogin = !isLogin" />
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

#navbar {
    .navbar-collapse {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
    }

    .navbar-nav {
        flex-direction: row;
        gap: 4px;
    }

    @media (max-width: 480px) {
        .navbar-collapse {
            justify-content: center;
        }

        .btn {
            padding: 4px 10px;
            font-size: 14px;
            margin-right: 0 !important;
        }
    }
}
</style>


