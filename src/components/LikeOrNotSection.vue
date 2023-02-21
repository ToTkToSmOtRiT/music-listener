<template>
    <div id="like">
        <button class="like"><img src="@/assets/like-icon.png" alt="Like"></button>
        <button class="dislike"><img src="@/assets/dislike-icon.png" alt="Dislike"></button>
    </div>
</template>


<script>

export default {
    name: 'LikeOrNot',
    components: {
    }
}

</script> 


<style lang="scss">
    button{
        border: none;
        background-color: #ffffff;

    }
</style>