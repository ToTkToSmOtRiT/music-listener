import Home from '@/views/Home'
import Listener from '@/views/Listener'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [{
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/listener',
        name: 'Listener',
        component: Listener
    },
    ]
})

export default router

