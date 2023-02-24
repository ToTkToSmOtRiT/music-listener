import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home'
import Listener from './views/Listener'
import 'aos/dist/aos.css'
import AOS from 'aos'
import ApiPlugin from '../plugins/api'

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
    history: createWebHistory(),
    routes,
})


const app = createApp(App)

app.use(ApiPlugin)
app.use(AOS.init())
app.use(router)

app.mount('#app')

