<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// import { useUserStore } from '@/stores/user'
import { useSmoothScroll } from '@/composables/useSmoothScroll'
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
</script>

<template>
  <div class="app">
    <!-- <AppPreloader v-if="showPreloader" @done="preloaded = true" /> -->
    <TheNav v-if="!isDashboard" />
    <main class="app__main" :class="{ 'app__main--dashboard': isDashboard }">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <TheFooter v-if="!isDashboard" />
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
