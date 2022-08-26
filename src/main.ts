import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/css/reset.css'
import '@/assets/css/common.less'
import store from '@/stores/index'
import mitt from "mitt"


const app = createApp(App)
const Mit = mitt()
declare module "vue" {
    export interface ComponentCustomProperties {
        mittBus: typeof Mit
    }
}
app.config.globalProperties.mittBus = Mit;
app.config.globalProperties.$ = Mit;
app
    .use(store)
    // .use(ElementPlus,{size:"small"})

app.mount('#app')
