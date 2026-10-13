<template>
    <div>
        <section id="head-section" data-aos="fade">
            <h1>Welcome to the music listener app</h1>
            <NuxtLink data-aos="fade" class="start-btn" to="/listener">Start Listening</NuxtLink>
        </section>
        <section id="main-section">
            <h1 data-aos="fade" data-aos-duration="500">Main section</h1>
            <p data-aos="fade-up" data-aos-duration="1500">Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Excepturi itaque temporibus eaque incidunt
                veritatis laudantium repudiandae numquam voluptatem magnam harum.</p>
            <ul data-aos="fade-up" data-aos-duration="2000">
                <li v-for="n in 3" :key="n">Section {{ n }} <p>Content for Section {{ n }}</p>
                </li>
            </ul>
        </section>
        <section id="genres">
            <h1 data-aos="fade" data-aos-duration="1500">Genres</h1>
            <ul class="genres-list" data-aos="fade" data-aos-duration="2000">
                <li v-for="genre in genres" :key="genre">
                    <h3>{{ genre }}</h3>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup>
const genres = ['Pop', 'Rock', 'Rap', 'Jazz', 'Folk', 'Funk']
</script>

<style lang="scss">
#head-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(40px, 12vh, 140px);
    min-height: clamp(420px, 80vh, 700px);
    padding: 40px 16px;
    background-color: black;
    background-image: url('~/assets/pxfuel.jpg');
    background-size: cover;
    background-position: center;

    h1 {
        margin: 0;
        font-size: clamp(1.8rem, 6vw, 3rem);
        text-shadow: 1px 1px 1px black;
    }

    .start-btn {
        font-size: clamp(16px, 2.5vw, 20px);
        text-decoration-line: none;
        color: white;
        padding: 10px 18px;
        border: 2px solid white;
        transition: background 0.2s, color 0.2s;

        &:hover {
            background: white;
            color: black;
        }
    }
}

#main-section {
    max-width: 1100px;
    margin: clamp(30px, 6vw, 50px) auto;
    padding: clamp(24px, 5vw, 50px) 16px;

    h1 {
        font-size: clamp(1.6rem, 5vw, 2.4rem);
    }

    ul {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px clamp(24px, 6vw, 100px);
        margin: 20px 0;
        padding: 0;
        list-style: none;
    }
}

#genres {
    max-width: 700px;
    margin: 0 auto clamp(60px, 10vw, 200px);
    padding: clamp(24px, 5vw, 50px) 16px;

    h1 {
        padding: 20px 0;
        font-size: clamp(1.6rem, 5vw, 2.4rem);
    }

    .genres-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: clamp(10px, 2.5vw, 20px);
        margin: 0;
        padding: clamp(8px, 2vw, 14px);
        list-style: none;
        border: clamp(5px, 1.5vw, 10px) solid white;
        font-family: 'Aboreto', cursive;
        color: #79611f;

        li {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: clamp(70px, 14vw, 120px);
            background-color: rgb(190, 190, 190);
        }

        h3 {
            margin: 0;
            font-size: clamp(1rem, 3.5vw, 1.75rem);
        }
    }

    @media (max-width: 420px) {
        .genres-list {
            grid-template-columns: repeat(2, 1fr);
        }
    }
}
</style>
