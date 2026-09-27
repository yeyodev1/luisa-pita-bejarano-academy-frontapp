<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// import { useUserStore } from '@/stores/user'
import { getLenis, useSmoothScroll } from '@/composables/useSmoothScroll'
import TheNav from '@/components/layout/TheNav.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
// import AppPreloader from '@/components/ui/AppPreloader.vue'

useSmoothScroll()

const route = useRoute()
// const userStore = useUserStore()
// const preloaded = ref(false)

// const showPreloader = computed(
//   () => !userStore.isAuthenticated && route.name === 'home' && !preloaded.value,
// )

const isDashboard = computed(() => route.path.startsWith('/app') || route.path.startsWith('/admin'))

/** Checkout enfocado: sin menú ni pie de página, como cualquier pasarela de pago. */
const FOCUSED_ROUTES = new Set(['subscribe', 'subscription-welcome'])
const isFocused = computed(() => FOCUSED_ROUTES.has(String(route.name)))
const showChrome = computed(() => !isDashboard.value && !isFocused.value)

/**
 * Al entrar a una página nueva se sube al inicio. Lo hacemos al montar la
 * vista (después del fade) porque Lenis ignora el scrollBehavior del router.
 * Con atrás/adelante del navegador se respeta la posición guardada.
 */
let fromHistory = false
const markHistoryNavigation = () => {
  fromHistory = true
}

function resetScroll() {
  if (fromHistory || route.hash) {
    fromHistory = false
    return
  }
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

onMounted(() => window.addEventListener('popstate', markHistoryNavigation))
onBeforeUnmount(() => window.removeEventListener('popstate', markHistoryNavigation))
</script>

<template>
  <div class="app">
    <!-- <AppPreloader v-if="showPreloader" @done="preloaded = true" /> -->
    <TheNav v-if="showChrome" />
    <main class="app__main" :class="{ 'app__main--dashboard': isDashboard }">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in" @before-enter="resetScroll">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <TheFooter v-if="showChrome" />
  </div>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.app__main {
  flex: 1 1 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
