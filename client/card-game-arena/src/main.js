import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';
import Vue3TouchEvents from "vue3-touch-events";

import 'ant-design-vue/dist/antd.dark.css';

import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(Vue3TouchEvents);
app.use(Antd)

app.mount('#app')
