<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import PayFirstModal from '@/components/ui/PayFirstModal/index.vue'

interface Props {
  open?: boolean
}

withDefaults(defineProps<Props>(), {
  open: false,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const launchDeadline = (import.meta.env.VITE_LAUNCH_DEADLINE as string) || '2026-07-16T00:00:00-05:00'
const isBeforeLaunch = computed(() => new Date().getTime() < new Date(launchDeadline).getTime())

const activeModal = ref<'logout' | null>(null)
const showPayFirstModal = ref(false)
const pendingNavTarget = ref<string | null>(null)
interface Toast {
  id: number
  itemName: string
  timer: ReturnType<typeof setTimeout>
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

function triggerToast(itemName: string) {
  const id = ++toastIdCounter
  const timer = setTimeout(() => dismissToast(id), 4000)
  toasts.value.push({ id, itemName, timer })
}

function dismissToast(id: number) {
  const toast = toasts.value.find(t => t.id === id)
  if (toast) clearTimeout(toast.timer)
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const menuItems = computed(() => {
  const items = [
    { name: 'dashboard', label: 'Inicio', icon: 'home' },
    { name: 'calendar', label: 'Calendario', icon: 'calendar' },
    { name: 'recorded-classes', label: 'Clases grabadas', icon: 'film' },
    { name: 'courses', label: 'Mis cursos', icon: 'book-open' },
    { name: 'recipes', label: 'Recetas', icon: 'utensils' },
    { name: 'achievements', label: 'Logros', icon: 'trophy' },
    { name: 'payments', label: 'Pagos', icon: 'credit-card' },
  ]

  if (userStore.role === 'admin') {
    items.push({ name: 'admin-courses', label: 'Panel admin', icon: 'user-shield' })
  }

  return items
})

function isActive(name: string): boolean {
  if (name === 'dashboard') return route.name === 'dashboard'
  return route.name === name || route.path.startsWith(`/app/${name.replace('-', '-')}`)
}

function onLinkClick() {
  emit('close')
}

function handleNavClick(name: string) {
  if (name === 'payments') {
    router.push({ name })
    emit('close')
    return
  }
  if (isBeforeLaunch.value) {
    triggerToast(name)
    return
  }
  if (userStore.role === 'admin') {
    router.push({ name })
    emit('close')
    return
  }
  if (userStore.hasActiveAccess) {
    router.push({ name })
    emit('close')
    return
  }
  pendingNavTarget.value = name
  showPayFirstModal.value = true
}

function goToPayments() {
  showPayFirstModal.value = false
  pendingNavTarget.value = null
  router.push({ name: 'payments' })
  emit('close')
}

function closePayFirstModal() {
  showPayFirstModal.value = false
  pendingNavTarget.value = null
}

function openModal(modal: 'logout') {
  activeModal.value = modal
}

function closeModal() {
  activeModal.value = null
}

function goToSettings() {
  router.push({ name: 'settings' })
  emit('close')
}

function logout() {
  closeModal()
  userStore.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }">
    <div class="sidebar__header">
      <RouterLink :to="{ name: 'dashboard' }" class="sidebar__brand" @click="onLinkClick">
        <BrandWordmark size="sm" />
      </RouterLink>
      <button class="sidebar__close" type="button" aria-label="Cerrar menú" @click="$emit('close')">
        <span /><span />
      </button>
    </div>

    <nav class="sidebar__nav">
      <button
        v-for="item in menuItems"
        :key="item.name"
        type="button"
        class="sidebar__link"
        :class="{ 'sidebar__link--active': isActive(item.name) }"
        @click="handleNavClick(item.name)"
      >
        <span class="sidebar__icon" aria-hidden="true">
          <i
            class="fa-solid"
            :class="{
              'fa-house': item.icon === 'home',
              'fa-book-open': item.icon === 'book-open',
              'fa-video': item.icon === 'video',
              'fa-calendar-days': item.icon === 'calendar',
              'fa-film': item.icon === 'film',
              'fa-utensils': item.icon === 'utensils',
              'fa-trophy': item.icon === 'trophy',
              'fa-credit-card': item.icon === 'credit-card',
              'fa-user-shield': item.icon === 'user-shield',
            }"
          />
        </span>
        <span class="sidebar__label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__profile">
        <UserAvatar
          :name="userStore.name"
          :last-name="userStore.lastName"
          :picture="userStore.profilePicture"
          size="md"
        />
        <div class="sidebar__profile-info">
          <span class="sidebar__profile-name">{{ userStore.fullName }}</span>
          <span class="sidebar__profile-status">
            Miembro {{ userStore.subscriptionStatus === 'active' ? 'VIP' : 'registrado' }}
          </span>
        </div>
      </div>

      <div class="sidebar__actions">
        <button class="sidebar__action" type="button" @click="goToSettings">
          <span class="sidebar__action-icon" aria-hidden="true">
            <i class="fa-solid fa-gear" />
          </span>
          Configuración
        </button>
        <button class="sidebar__action sidebar__action--danger" type="button" @click="openModal('logout')">
          <span class="sidebar__action-icon" aria-hidden="true">
            <i class="fa-solid fa-arrow-right-from-bracket" />
          </span>
          Cerrar sesión
        </button>
      </div>

      <p class="sidebar__copy">© {{ new Date().getFullYear() }} Luisa Pita Bejarano</p>
    </div>
  </aside>

  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast-item"
      >
        <i class="fa-solid fa-lock toast-item__icon" />
        <div class="toast-item__content">
          <span class="toast-item__title">Contenido bloqueado</span>
          <span class="toast-item__text">Disponible a partir del 16 de julio</span>
        </div>
        <button class="toast-item__close" type="button" aria-label="Cerrar" @click="dismissToast(t.id)">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
    </transition-group>
  </div>

  <transition name="fade">
    <div v-if="open" class="sidebar__backdrop" @click="$emit('close')" />
  </transition>

  <ConfirmModal
    :open="activeModal === 'logout'"
    title="Cerrar sesión"
    message="Vas a cerrar tu sesión en Luisa Pita Bejarano Academy. Deberás volver a iniciar sesión para acceder a tu cuenta."
    action-label="Cerrar sesión"
    danger
    @confirm="logout"
    @cancel="closeModal"
  />

  <PayFirstModal
    :open="showPayFirstModal"
    @confirm="goToPayments"
    @cancel="closePayFirstModal"
  />
</template>

<style lang="scss" scoped>
.sidebar {
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

.sidebar__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: $lpb-paper;
  border-bottom: 1px solid var(--border);
}

.sidebar__brand {
  color: $lpb-black;
}

.sidebar__close {
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

.sidebar__nav {
  flex: 1 1 auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.sidebar__link {
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

    .sidebar__icon {
      color: $lpb-green-deep;
    }
  }
}

.sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: $lpb-muted;
  transition: color 0.2s ease;
}

.sidebar__footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar__profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: rgba($lpb-black, 0.03);
  border: 1px solid var(--border);
}

.sidebar__profile-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.sidebar__profile-name {
  font-family: $font-sans;
  font-size: 0.85rem;
  font-weight: 600;
  color: $lpb-black;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__profile-status {
  font-family: $font-mono;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-green-deep;
}

.sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar__action {
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

.sidebar__action--danger {
  color: $alert-error;

  &:hover {
    background: $alert-error-bg;
    color: darken($alert-error, 10%);
  }
}

.sidebar__action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.sidebar__copy {
  font-family: $font-mono;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-muted;
  margin: 0;
  text-align: center;
}

.sidebar__backdrop {
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

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  background: $lpb-paper;
  border: 1px solid rgba($lpb-black, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 8px 32px rgba($lpb-black, 0.12);
  font-family: $font-sans;
  line-height: 1.3;
}

.toast-item__icon {
  flex-shrink: 0;
  font-size: 0.9rem;
  color: $lpb-amber;
  margin-top: 0.1rem;
}

.toast-item__content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toast-item__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: $lpb-black;
}

.toast-item__text {
  font-size: 0.8rem;
  color: $lpb-muted;
}

.toast-item__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: rgba($lpb-black, 0.04);
  border: none;
  color: $lpb-muted;
  cursor: pointer;
  border-radius: 0.35rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba($lpb-black, 0.08);
    color: $lpb-black;
  }
}

.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.2, 0.7, 0, 1);
}

.toast-leave-active {
  position: absolute;
  transition: all 0.3s ease-in;
}

.toast-move {
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(60px);
}

@media (max-width: 960px) {
  .sidebar {
    transform: translateX(-100%);

    &--open {
      transform: translateX(0);
    }
  }

  .sidebar__close {
    display: flex;
  }
}
</style>
