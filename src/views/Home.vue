<template>
    <div>
        <div id="head-section">
            <h1>Wellcome to the music listener app</h1>
            <RouterLink to="/listener">Start Listening</RouterLink>
        </div>
        <div id="main-section">

        </div>
        <div id="genres">

        </div>
    </div>
</template>

<style lang="scss">
#head-section{
    background-color: black;
    opacity: 0.9;
    height: 600px;
    position:relative;
    padding-top: 150px;
    background-image: url('@/assets/pxfuel.jpg');
    background-size: cover;
    h1{
        text-shadow: 1px 1px 1px black;
    }
    
    
}
</style>