<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardSidebar from './DashboardSidebar.vue'
import DashboardPageHeader from './DashboardPageHeader.vue'
import DashboardSkeleton from './DashboardSkeleton.vue'

const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const mobileMenuOpen = ref(false)

let unsubscribe: (() => void) | null = null
let loadingTimer: number | undefined

onMounted(() => {
  const removeBefore = router.beforeEach(() => {
    window.clearTimeout(loadingTimer)
    isLoading.value = true
  })
  const removeAfter = router.afterEach(() => {
    mobileMenuOpen.value = false
    loadingTimer = window.setTimeout(() => { isLoading.value = false }, 320)
  })

  unsubscribe = () => {
    removeBefore()
    removeAfter()
  }
})

onUnmounted(() => {
  unsubscribe?.()
  window.clearTimeout(loadingTimer)
})

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <div class="dashboard">
    <DashboardSidebar :open="mobileMenuOpen" @close="mobileMenuOpen = false" />
    <div class="dashboard__main">
      <button
        class="dashboard__menu"
        type="button"
        :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleMobileMenu"
      >
        <span class="dashboard__menu-text">{{ mobileMenuOpen ? 'Cerrar' : 'Menú' }}</span>
        <span class="dashboard__menu-burger" :class="{ 'dashboard__menu-burger--open': mobileMenuOpen }">
          <span />
          <span />
        </span>
      </button>

      <div class="dashboard__content">
        <DashboardPageHeader :loading="isLoading" />
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <div :key="route.fullPath" class="dashboard__view">
              <DashboardSkeleton v-if="isLoading" />
              <component :is="Component" v-else />
            </div>
          </Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: $lpb-cream;
}

.dashboard__main {
  flex: 1 1 auto;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.dashboard__menu {
  display: none;
  align-items: center;
  gap: 0.7rem;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 800;
  padding: 0.55rem 0.9rem 0.55rem 0.75rem;
  border-radius: 999px;
  background: rgba($lpb-paper, 0.92);
  border: 1px solid var(--border);
  backdrop-filter: blur(12px);
  color: $lpb-black;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba($lpb-black, 0.08);

  &-text {
    font-family: $font-mono;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  &-burger {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 20px;
    height: 12px;
    position: relative;

    span {
      display: block;
      width: 100%;
      height: 2px;
      background: currentColor;
      border-radius: 1px;
      transition: transform 0.35s cubic-bezier(0.2, 0.7, 0, 1), opacity 0.25s ease;
      transform-origin: center;
    }

    &--open span:nth-child(1) {
      transform: translateY(5px) rotate(45deg);
    }

    &--open span:nth-child(2) {
      transform: translateY(-5px) rotate(-45deg);
    }
  }
}

.dashboard__content {
  flex: 1 1 auto;
  padding: 0 2rem 3rem;
  overflow-x: clip;
}

.dashboard__view {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.2, 0.7, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 960px) {
  .dashboard__main {
    margin-left: 0;
  }

  .dashboard__menu {
    display: inline-flex;
  }

  .dashboard__content {
    padding: 4.5rem 1rem 2rem;
  }
}
</style>
