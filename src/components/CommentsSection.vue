<template>
    <div id="comments">
        <h3>Comments</h3>
        <form action="">
            <input class="comment" type="text" placeholder="Введите текст">
            <button type="submit">Отправить</button>
        </form>
    </div>
</template>


<script>

export default {
    name: 'CommentsSection',
    components: {

    }
}

</script> 


<style lang="scss">
#comments {
    // background: linear-gradient(#afafaf, transparent);
    margin: 100px 0px;
    h3 {
        font-family: 'Aboreto', cursive;
        font-size: 20px;
        margin: 20px 0px;
    }

    form {
        .comment {
            border: none;
            background-color: transparent;
        }
        button{
            background-color: transparent;
        }
    }
}
</style>