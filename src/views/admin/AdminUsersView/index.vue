<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { adminService, type AdminUser, type CreateUserPayload } from '@/services/adminService'
import { useUserStore } from '@/stores/user'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import CountdownTimer from '@/components/ui/CountdownTimer.vue'
import UserFilters from './UserFilters.vue'
import UsersTable from './UsersTable.vue'
import CreateUserModal from './CreateUserModal.vue'
import ExtendAccessModal from './ExtendAccessModal.vue'

const userStore = useUserStore()

const users = ref<AdminUser[]>([])
const loading = ref(false)
const skeletonLoading = ref(true)
const error = ref('')
const success = ref('')

const filters = reactive({
  role: '',
  subscriptionStatus: '',
})

const showCreateModal = ref(false)
const showExtendModal = ref(false)
const selectedUser = ref<AdminUser | null>(null)
const deleteTarget = ref<AdminUser | null>(null)
const revokeTarget = ref<AdminUser | null>(null)
const founderTarget = ref<AdminUser | null>(null)
const founderLoading = ref(false)

const releaseDate = (import.meta.env.VITE_PRESALE_DEADLINE as string) || '2026-07-16T23:59:59-05:00'

const hasFilters = computed(() => filters.role !== '' || filters.subscriptionStatus !== '')

function formatDate(iso: string | null) {
  if (!iso) return 'Sin fecha'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'
  return date.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function loadUsers(showSkeleton = true) {
  if (showSkeleton) skeletonLoading.value = true
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminService.listUsers({
      role: filters.role || undefined,
      subscriptionStatus: filters.subscriptionStatus || undefined,
    })
    users.value = data.data.users
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al cargar usuarios'
  } finally {
    loading.value = false
    skeletonLoading.value = false
  }
}

function resetFilters() {
  filters.role = ''
  filters.subscriptionStatus = ''
  loadUsers(true)
}

async function createUser(payload: CreateUserPayload) {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await adminService.createUser(payload)
    success.value = 'Usuario creado correctamente. Se envió un email de invitación.'
    showCreateModal.value = false
    await loadUsers(false)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al crear usuario'
  } finally {
    loading.value = false
  }
}

function openExtendModal(user: AdminUser) {
  selectedUser.value = user
  showExtendModal.value = true
}

async function extendAccess(months: number) {
  if (!selectedUser.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await adminService.updateAccess(selectedUser.value.id, {
      action: 'extend',
      months,
    })
    success.value = `Acceso extendido hasta ${formatDate(selectedUser.value.accessUntil)}`
    showExtendModal.value = false
    await loadUsers(false)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al extender acceso'
  } finally {
    loading.value = false
  }
}

function confirmDelete(user: AdminUser) {
  if (user.id === userStore.id) {
    error.value = 'No puedes eliminar tu propia cuenta'
    return
  }
  deleteTarget.value = user
}

async function deleteUser() {
  if (!deleteTarget.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await adminService.deleteUser(deleteTarget.value.id)
    success.value = 'Usuario eliminado correctamente'
    deleteTarget.value = null
    await loadUsers(false)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al eliminar usuario'
  } finally {
    loading.value = false
  }
}

function confirmRevoke(user: AdminUser) {
  revokeTarget.value = user
}

async function revokeAccessConfirmed() {
  if (!revokeTarget.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await adminService.updateAccess(revokeTarget.value.id, { action: 'revoke' })
    success.value = 'Acceso revocado correctamente'
    revokeTarget.value = null
    await loadUsers(false)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al revocar acceso'
  } finally {
    loading.value = false
  }
}

async function toggleFoundingMember() {
  if (!founderTarget.value) return
  founderLoading.value = true
  error.value = ''
  success.value = ''
  try {
    const nextValue = !founderTarget.value.foundingMember
    await adminService.setFoundingMember(founderTarget.value.id, nextValue)
    success.value = `${founderTarget.value.name} ${nextValue ? 'ahora es' : 'ya no es'} miembro fundador`
    founderTarget.value = null
    await loadUsers(false)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al actualizar miembro fundador'
  } finally {
    founderLoading.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="admin-users">
    <section class="admin-users__timer-banner">
      <div class="admin-users__timer-info">
        <span class="admin-users__timer-eyebrow">Lanzamiento de la comunidad</span>
        <h2 class="admin-users__timer-title">Acceso se libera el 16 de julio</h2>
        <p class="admin-users__timer-text">
          Los miembros fundadores obtendrán acceso prioritario y beneficios exclusivos.
        </p>
      </div>
      <CountdownTimer :target="releaseDate" label="Tiempo restante para la apertura" />
    </section>

    <header class="admin-users__top">
      <div class="admin-users__titles">
        <h1 class="admin-users__page-title">Usuarios</h1>
        <p class="admin-users__page-subtitle">
          Gestiona alumnos y administradores de la academia.
        </p>
      </div>
      <button class="admin-users__btn admin-users__btn--primary" @click="showCreateModal = true">
        <i class="fa-solid fa-plus" />
        Crear usuario
      </button>
    </header>

    <Transition name="slide-down" appear>
      <div v-if="error || success" class="admin-users__alerts">
        <div v-if="error" class="admin-users__alert admin-users__alert--error">
          <i class="fa-solid fa-circle-exclamation" />
          {{ error }}
        </div>
        <div v-if="success" class="admin-users__alert admin-users__alert--success">
          <i class="fa-solid fa-circle-check" />
          {{ success }}
        </div>
      </div>
    </Transition>

    <UserFilters
      v-model:role="filters.role"
      v-model:subscription-status="filters.subscriptionStatus"
      @change="loadUsers"
      @reset="resetFilters"
    >
      <template #count>
        <span class="admin-users__count">
          {{ users.length }} {{ users.length === 1 ? 'usuario' : 'usuarios' }}
        </span>
      </template>
    </UserFilters>

    <UsersTable
      :users="users"
      :skeleton-loading="skeletonLoading"
      :has-filters="hasFilters"
      @extend="openExtendModal"
      @revoke="confirmRevoke"
      @delete="confirmDelete"
      @founding-member="founderTarget = $event"
      @reset-filters="resetFilters"
    />

    <CreateUserModal
      :open="showCreateModal"
      :loading="loading"
      @close="showCreateModal = false"
      @submit="createUser"
    />

    <ExtendAccessModal
      :open="showExtendModal"
      :user="selectedUser"
      :loading="loading"
      @close="showExtendModal = false"
      @submit="extendAccess"
    />

    <ConfirmModal
      :open="!!deleteTarget"
      title="Eliminar usuario"
      :message="`¿Estás segura de eliminar a ${deleteTarget?.name} ${deleteTarget?.lastName}? Se eliminarán también sus pagos manuales. Esta acción es irreversible y el alumno perderá todo acceso a la academia.`"
      action-label="Eliminar"
      confirm-text="eliminar"
      danger
      @confirm="deleteUser"
      @cancel="deleteTarget = null"
    />

    <ConfirmModal
      :open="!!revokeTarget"
      title="Revocar acceso"
      :message="`¿Estás segura de revocar el acceso de ${revokeTarget?.name} ${revokeTarget?.lastName}? Esta acción es irreversible: el alumno perderá el acceso inmediatamente y su suscripción pasará a inactiva.`"
      action-label="Revocar acceso"
      confirm-text="revocar"
      danger
      @confirm="revokeAccessConfirmed"
      @cancel="revokeTarget = null"
    />

    <ConfirmModal
      :open="!!founderTarget"
      :title="founderTarget?.foundingMember ? 'Quitar miembro fundador' : 'Marcar como miembro fundador'"
      :message="founderTarget?.foundingMember
        ? `¿Quitar a ${founderTarget?.name} ${founderTarget?.lastName} como miembro fundador?`
        : `¿Marcar a ${founderTarget?.name} ${founderTarget?.lastName} como miembro fundador? Obtendrá acceso prioritario y beneficios exclusivos.`"
      :action-label="founderTarget?.foundingMember ? 'Quitar' : 'Marcar fundador'"
      :confirm-text="founderTarget?.foundingMember ? 'quitar' : 'marcar'"
      :danger="!!founderTarget?.foundingMember"
      :loading="founderLoading"
      @confirm="toggleFoundingMember"
      @cancel="founderTarget = null"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/admin-shared.scss';

.admin-users {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
}

.admin-users__timer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, $lpb-black 0%, $lpb-ink 100%);
  color: $lpb-white;
  border-radius: 1.25rem;
  padding: 1.75rem 2rem;
}

.admin-users__timer-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 auto;
}

.admin-users__timer-eyebrow {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba($lpb-white, 0.7);
}

.admin-users__timer-title {
  font-family: $font-display;
  font-size: 1.6rem;
  font-weight: 400;
  margin: 0;
  color: $lpb-white;
}

.admin-users__timer-text {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: rgba($lpb-white, 0.75);
  margin: 0;
  max-width: 45ch;
}

.admin-users__timer-banner .countdown-timer :deep(.countdown-timer__block) {
  background: rgba($lpb-white, 0.1);
  border-color: rgba($lpb-white, 0.15);
}

.admin-users__timer-banner .countdown-timer :deep(.countdown-timer__value) {
  color: $lpb-white;
}

.admin-users__timer-banner .countdown-timer :deep(.countdown-timer__label) {
  color: rgba($lpb-white, 0.7);
}

.admin-users__timer-banner .countdown-timer :deep(.countdown-timer__unit) {
  color: rgba($lpb-white, 0.6);
}

.admin-users__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.admin-users__titles {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.admin-users__page-title {
  font-family: $font-display;
  font-size: 1.85rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.admin-users__page-subtitle {
  font-family: $font-sans;
  font-size: 0.95rem;
  color: $lpb-muted;
  margin: 0;
}

.admin-users__count {
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.admin-users__alerts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-users__alert {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  font-family: $font-sans;
  font-size: 0.9rem;

  &--error {
    background: $alert-error-bg;
    color: $alert-error;
  }

  &--success {
    background: $alert-success-bg;
    color: $lpb-green-deep;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 720px) {
  .admin-users__top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
