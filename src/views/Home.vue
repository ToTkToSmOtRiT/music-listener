<template>
    <div>
        <div id="head-section" data-aos="fade">
            <!-- <transition name="fade" mode="out-in"> -->
            <h1 data-aos="fade">Wellcome to the music listener app</h1>
            <!-- </transition> -->
            <RouterLink data-aos="fade" class="start-btn" to="/listener">Start Listening</RouterLink>
        </div>
        <div id="main-section">
            <h1 data-aos="fade" data-aos-duration="500">Main section</h1>
            <p data-aos="fade-up" data-aos-duration="1500">Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Excepturi itaque temporibus eaque incidunt
                veritatis laudantium repudiandae numquam voluptatem magnam harum.</p>
            <ul data-aos="fade-up" data-aos-duration="2000">
                <li>Section 1 <p>Content for Section 1</p>
                </li>
                <li>Section 2 <p>Content for Section 2</p>
                </li>
                <li>Section 3 <p>Content for Section 3</p>
                </li>
            </ul>
        </div>
        <div id="genres">
            <h1 data-aos="fade" data-aos-duration="1500">Genres</h1>
            <table class="genres-list" data-aos="fade" data-aos-duration="2000">
                <tr>
                    <td>
                        <h3>Pop</h3>
                    </td>
                    <td>
                        <h3>Rock</h3>
                    </td>
                    <td>
                        <h3>Rap</h3>
                    </td>
                </tr>
                <tr>
                    <td>
                        <h3>Jazz</h3>
                    </td>
                    <td>
                        <h3>Folk</h3>
                    </td>
                    <td>
                        <h3>Funk</h3>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>


<style lang="scss">
#head-section {
    background-color: black;
    opacity: 0.9;
    height: 700px;
    // position: relative;
    padding-top: 150px;
    background-image: url('@/assets/pxfuel.jpg');
    background-size: cover;
    h1 {
        text-shadow: 1px 1px 1px black;
    }
    .start-btn {
        position: relative;
        font-size: 20px;
        top: 200px;
        text-decoration-line: none;
        color: white;
        padding: 10px;
        border: 2px solid white;
    }
}
#main-section {
    height: 800px;
    font-size: 100%;
    padding: 50px;
    margin: 50px 0px;

    ul {
        left: 50%;
        margin: 20px 0px;
        list-style: none;
        display: flex;
        justify-content: center;
        flex-direction: row;

        li {
            margin: 10px 80px;
        }
    }
}
#genres {
    height: 600px;
    padding: 50px;
    margin-bottom: 200px;
    h1{
        padding: 20px;
    }
    .genres-list {
        font-family: 'Aboreto', cursive;
        color: #79611f;
        margin-left: auto;
        margin-right: auto;
        // margin-top: 83px;
        // margin-bottom: 85px;
        width: 500px;
        height: 500px;
        border: 10px solid white;
        border-spacing: 20px;
        tr {
            td {
                border: 10px solid white;
                padding: 20px 90px;
                background-color: rgb(190, 190, 190);
            }
        }
    }
}
</style>