import { createApp } from 'vue'
// import Vue from 'vue'
import App from './App.vue'
// import router from './router'
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home'
import Listener from './views/Listener'
import 'aos/dist/aos.css'
import AOS from 'aos'

// createApp(App).mount('#app')

// new Vue({
//     router,
//     render: h => h(App),
// }).$mount('#app')

const routes = [
    {
        path: '/',
        component: Home
    },
    {
        path: '/listener',
        component: Listener
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})


const app = createApp(App)

app.use(AOS.init())

app.use(router)

app.mount('#app')

