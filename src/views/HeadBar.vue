<template>
    <header class="p-3 text-bg-dark">
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
                        <button type="button" class="btn btn-outline-light me-2">Login</button>
                        <button type="button" class="btn btn-outline-light me-2">Sign-up</button>
                    </div>
                </div>
            </div>
        </nav>
    </header>
</template>

<script>

export default {
    name: "HeadBar",

}
</script>

<style lang="scss">

</style>