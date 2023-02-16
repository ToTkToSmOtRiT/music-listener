<template>
    <div>
        <div id="head-section" data-aos="fade">
            <!-- <transition name="fade" mode="out-in"> -->
            <h1 >Wellcome to the music listener app</h1>
            <!-- </transition> -->
            <RouterLink class="start-btn" to="/listener">Start Listening</RouterLink>
        </div>
        <div id="main-section">
            <h1 data-aos="fade" data-aos-duration="500">Main section</h1>
            <p data-aos="fade-up" data-aos-duration="1500">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Excepturi itaque temporibus eaque incidunt
                veritatis laudantium repudiandae numquam voluptatem magnam harum.</p>
        </div>
        <div id="genres">
            <h1 data-aos="fade" data-aos-duration="1500">Genres</h1>
        </div>
    </div>
</template>


<style lang="scss">
// .fade-enter-active, .fade-leave-active {
//   transition: opacity .5s;
// }

#head-section {
    background-color: black;
    opacity: 0.9;
    height: 700px;
    position: relative;
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
    height: 1000px;
    padding: 50px;
    margin: 50px 0px;
}

#genres {
    height: 600px;
    padding: 50px;
    margin: 50px 0px;
}
</style>