<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const mobileMenuOpen = ref(false)
const showLogoutConfirm = ref(false)

const menuItems = [
  { name: 'admin-courses', label: 'Cursos y clases', icon: 'book' },
  { name: 'admin-recorded-classes', label: 'Clases grabadas', icon: 'film' },
  { name: 'admin-calendar', label: 'Calendario', icon: 'calendar' },
  { name: 'admin-recipes', label: 'Recetas', icon: 'utensils' },
  { name: 'admin-achievements', label: 'Logros', icon: 'trophy' },
  { name: 'admin-comments', label: 'Comentarios', icon: 'comments' },
  { name: 'admin-users', label: 'Usuarios', icon: 'users' },
  { name: 'admin-payments', label: 'Pagos manuales', icon: 'money-bill' },
]

function isActive(name: string): boolean {
  return route.name === name
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function promptLogout() {
  showLogoutConfirm.value = true
}

function logout() {
  showLogoutConfirm.value = false
  userStore.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="admin">
    <aside class="admin__sidebar" :class="{ 'admin__sidebar--open': mobileMenuOpen }">
      <div class="admin__sidebar-header">
        <RouterLink :to="{ name: 'dashboard' }" class="admin__brand">
          <BrandWordmark size="sm" />
        </RouterLink>
        <button
          class="admin__close"
          type="button"
          aria-label="Cerrar menú"
          @click="mobileMenuOpen = false"
        >
          <span /><span />
        </button>
      </div>

      <nav class="admin__nav">
        <RouterLink
          v-for="item in menuItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="admin__link"
          :class="{ 'admin__link--active': isActive(item.name) }"
          @click="mobileMenuOpen = false"
        >
          <span class="admin__icon" aria-hidden="true">
            <i
              class="fa-solid"
              :class="{
                'fa-users': item.icon === 'users',
                'fa-money-bill': item.icon === 'money-bill',
                'fa-book': item.icon === 'book',
                'fa-calendar': item.icon === 'calendar',
                'fa-utensils': item.icon === 'utensils',
                'fa-trophy': item.icon === 'trophy',
                'fa-comments': item.icon === 'comments',
              }"
            />
          </span>
          <span class="admin__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin__sidebar-footer">
        <button class="admin__logout" type="button" @click="promptLogout">
          <span class="admin__icon" aria-hidden="true">
            <i class="fa-solid fa-arrow-right-from-bracket" />
          </span>
          Cerrar sesión
        </button>
        <p class="admin__copy">Panel de administración</p>
      </div>
    </aside>

    <ConfirmModal
      :open="showLogoutConfirm"
      title="Cerrar sesión"
      message="¿Estás segura de cerrar sesión? Deberás volver a iniciar sesión para acceder al panel de administración."
      action-label="Cerrar sesión"
      confirm-text="cerrar"
      danger
      @confirm="logout"
      @cancel="showLogoutConfirm = false"
    />

    <div class="admin__main">
      <button
        class="admin__menu"
        type="button"
        :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleMobileMenu"
      >
        <span class="admin__menu-text">{{ mobileMenuOpen ? 'Cerrar' : 'Menú' }}</span>
        <span class="admin__menu-burger" :class="{ 'admin__menu-burger--open': mobileMenuOpen }">
          <span />
          <span />
        </span>
      </button>

      <header class="admin__header">
        <h1 class="admin__title">Panel de administración</h1>
        <RouterLink :to="{ name: 'dashboard' }" class="admin__back">
          Volver a la app
        </RouterLink>
      </header>

      <main class="admin__content">
        <RouterView />
      </main>
    </div>

    <transition name="fade">
      <div v-if="mobileMenuOpen" class="admin__backdrop" @click="mobileMenuOpen = false" />
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.admin {
  display: flex;
  min-height: 100vh;
  background: $lpb-cream;
}

.admin__sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100dvh;
  background: $lpb-paper;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 900;
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0, 1);
}

.admin__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: $lpb-paper;
  border-bottom: 1px solid var(--border);
}

.admin__brand {
  color: $lpb-black;
}

.admin__close {
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 24px;
  height: 24px;
  justify-content: center;
  cursor: pointer;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background: $lpb-black;
    border-radius: 1px;
  }

  span:nth-child(1) { transform: translateY(3.5px) rotate(45deg); }
  span:nth-child(2) { transform: translateY(-3.5px) rotate(-45deg); }
}

.admin__nav {
  flex: 1 1 auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.admin__link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  color: $lpb-graphite;
  font-family: $font-sans;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba($lpb-green, 0.08);
    color: $lpb-black;
  }

  &--active {
    background: rgba($lpb-green, 0.14);
    color: $lpb-green-deep;

    .admin__icon {
      color: $lpb-green-deep;
    }
  }
}

.admin__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: $lpb-muted;
  transition: color 0.2s ease;
}

.admin__sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin__logout {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.7rem 0.75rem;
  border-radius: 0.625rem;
  color: $lpb-graphite;
  font-family: $font-sans;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba($lpb-green, 0.08);
    color: $lpb-black;
  }
}

.admin__copy {
  font-family: $font-mono;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-muted;
  margin: 0;
  text-align: center;
}

.admin__main {
  flex: 1 1 auto;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.admin__menu {
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

.admin__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: rgba($lpb-cream, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin__title {
  font-family: $font-display;
  font-size: 1.5rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.admin__back {
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-green-deep;

  &:hover {
    text-decoration: underline;
  }
}

.admin__content {
  flex: 1 1 auto;
  padding: 1.5rem 2rem 3rem;
  overflow-x: clip;
}

.admin__backdrop {
  position: fixed;
  inset: 0;
  z-index: 890;
  background: rgba($lpb-black, 0.35);
  backdrop-filter: blur(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .admin__sidebar {
    transform: translateX(-100%);

    &--open {
      transform: translateX(0);
    }
  }

  .admin__close {
    display: flex;
  }

  .admin__main {
    margin-left: 0;
  }

  .admin__menu {
    display: inline-flex;
  }

  .admin__header {
    padding: 4.5rem 1rem 1.25rem;
  }

  .admin__content {
    padding: 1rem 1rem 2rem;
  }
}
</style>
