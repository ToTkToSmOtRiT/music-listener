<template>
    <footer>
        <ul>
            <li>
                <h6>About</h6>
            </li>
            <li>
                <h6>Help</h6>
            </li>
            <li>
                <h6>Privacy</h6>
            </li>
        </ul>
    </footer>
</template>

<style lang="scss">
footer {
    background-color: rgb(46, 46, 46);
    margin-top: clamp(60px, 10vw, 200px);
    padding: clamp(30px, 6vw, 60px) 16px;

    ul {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px clamp(24px, 8vw, 100px);
        margin: 0;
        padding: 0;
        list-style: none;
        font-family: 'Aboreto', cursive;
        color: white;

        li {
            margin: 10px 0;
        }
    }
}
</style>