import { createApp } from 'vue'
import App from './App.vue'
import 'aos/dist/aos.css'
import AOS from 'aos'
import ApiPlugin from './plugins/api'
import router from './router'
import Store from './store/index'

const app = createApp(App)

app.use(Store)
app.use(ApiPlugin)
app.use(AOS.init())
app.use(router)

app.mount('#app')

