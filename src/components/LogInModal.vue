<template>
    <div class="window">
        <div class="modal-content rounded-4 shadow">
            <div class="modal-header border-bottom-0">
                <h1 class="modal-title fs-5">Log In</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" @click="close" aria-label="Close"></button>
            </div>

            <div class="form mb-3">
                <label>Email address</label>
                <input type="email" class="form-control rounded-3" id="floatingInput" placeholder="name@example.com">
            </div>

            <div class="form mb-3">
                <label>Password</label>
                <input type="password" class="form-control rounded-3" id="floatingPassword" placeholder="Password">
            </div>

            <div class="modal-footer flex-column border-top-0">
                <button type="button" class="btn btn-dark">Log In</button>
                <button type="button" class="btn btn-dark" @click="close" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'modal',
    methods: {
        close() {
            this.$emit('close');
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