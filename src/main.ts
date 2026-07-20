import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/user'
import AppSelect from '@/components/ui/AppSelect.vue'
import '@/styles/global.scss'

const app = createApp(App)
app.component('AppSelect', AppSelect)

const pinia = createPinia()
app.use(pinia)

const userStore = useUserStore()
userStore.hydrate()

window.addEventListener('auth:token-expired', () => {
  userStore.clear()
  if (router.currentRoute.value.meta.requiresAuth) router.replace({ name: 'login' })
})

app.use(router)

Promise.resolve(userStore.isAuthenticated ? userStore.validateSession() : true).then(() => router.isReady()).then(() => {
  app.mount('#app')
})
