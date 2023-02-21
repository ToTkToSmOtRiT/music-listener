<template>
    <div id="comments-section">
        <h3>Comments</h3>
        <div class="adding-com">
            <form action="">
                <input class="comment" type="text" placeholder="Write your comment...">
                <button type="submit">Send</button>
            </form>
        </div>
        <div class="coms">
            <ul>
                <li v-for="coms in comments" :key="coms">
                    <span>{{ coms.name }}</span>
                    <br>
                    <p>
                        {{ coms.comment }}
                    </p>
                </li>
            </ul>
        </div>
    </div>
</template>


<script>

export default {
    name: 'CommentsSection',
    components: {

    },
    data() {
        return {
            comments: [
                {
                    id: 1,
                    name: 'Johny3',
                    comment: 'Great song'
                },
                {
                    id: 2,
                    name: 'PotatoMan',
                    comment: 'Not great song'
                },
            ]
        }
    }
}

</script> 


<style lang="scss">
#comments-section {
    // background: linear-gradient(#afafaf, transparent);
    margin: 100px 0px;
    .adding-com{
        height: 50px;
        input{
            border: none;
            outline: none;
        }
    }
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

        button {
            background-color: transparent;
        }
    }

    .coms {
        padding: 0px 250px;
        text-align: justify;

        li {
            list-style: none;
            margin: 10px;
            margin-bottom: 30px;

            span {
                font-weight: 700;
            }
        }
    }
}
</style>