<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { AdminUser } from '@/services/adminService'

const props = defineProps<{
  users: AdminUser[]
  skeletonLoading: boolean
  hasFilters: boolean
}>()

const emit = defineEmits<{
  (e: 'assessment', user: AdminUser): void
  (e: 'extend', user: AdminUser): void
  (e: 'revoke', user: AdminUser): void
  (e: 'delete', user: AdminUser): void
  (e: 'founding-member', user: AdminUser): void
  (e: 'reset-filters'): void
}>()

const userStore = useUserStore()
const skeletonRows = Array.from({ length: 6 }, (_, i) => i)

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

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Sin suscripción'
  }
}

function roleLabel(role: string) {
  return role === 'admin' ? 'Administrador' : 'Alumno'
}

const isCurrentUser = computed(() => (id: string) => id === userStore.id)
</script>

<template>
  <section class="admin-users__table-card">
    <Transition name="fade" mode="out-in">
      <div v-if="skeletonLoading" key="skeleton" class="admin-users__skeleton">
        <div v-for="n in skeletonRows" :key="n" class="admin-users__skeleton-row">
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--name" />
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--email" />
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--role" />
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--status" />
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--access" />
          <div class="admin-users__skeleton-cell admin-users__skeleton-cell--actions" />
        </div>
      </div>

      <div v-else-if="users.length === 0" key="empty" class="admin-users__empty">
        <div class="admin-users__empty-icon">
          <i class="fa-solid fa-users-slash" />
        </div>
        <h3 class="admin-users__empty-title">No se encontraron usuarios</h3>
        <p class="admin-users__empty-text">
          {{ hasFilters ? 'Prueba ajustando los filtros.' : 'Empieza creando un nuevo usuario.' }}
        </p>
        <button v-if="hasFilters" class="admin-users__btn admin-users__btn--ghost" @click="emit('reset-filters')">
          Limpiar filtros
        </button>
      </div>

      <div v-else key="table" class="admin-users__table-wrap">
        <table class="admin-users__table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acceso hasta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="admin-users__row">
              <td>
                <div class="admin-users__user">
                  <div class="admin-users__avatar">
                    {{ user.name.charAt(0).toUpperCase() }}{{ user.lastName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="admin-users__user-info">
                    <span class="admin-users__user-name">
                      {{ user.name }} {{ user.lastName }}
                      <span v-if="user.foundingMember" class="admin-users__founder-badge" title="Miembro fundador">
                        <i class="fa-solid fa-star" /> Fundador
                      </span>
                    </span>
                    <span class="admin-users__user-email">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="admin-users__badge"
                  :class="user.role === 'admin' ? 'admin-users__badge--admin' : 'admin-users__badge--user'"
                >
                  <i class="fa-solid" :class="user.role === 'admin' ? 'fa-shield-halved' : 'fa-graduation-cap'" />
                  {{ roleLabel(user.role) }}
                </span>
              </td>
              <td>
                <span
                  class="admin-users__badge"
                  :class="`admin-users__badge--${user.subscriptionStatus}`"
                >
                  <i
                    class="fa-solid"
                    :class="{
                      'fa-circle-check': user.subscriptionStatus === 'active',
                      'fa-clock': user.subscriptionStatus === 'pending',
                      'fa-circle-xmark': user.subscriptionStatus === 'none',
                    }"
                  />
                  {{ statusLabel(user.subscriptionStatus) }}
                </span>
              </td>
              <td>
                <span class="admin-users__access" :class="{ 'admin-users__access--none': !user.accessUntil }">
                  {{ formatDate(user.accessUntil) }}
                </span>
              </td>
              <td>
                <div class="admin-users__actions">
                  <button
                    v-if="user.role === 'user'"
                    class="admin-users__action admin-users__action--assessment"
                    title="Valoración física"
                    @click="emit('assessment', user)"
                  >
                    <i class="fa-solid fa-weight-scale" />
                  </button>
                  <button
                    v-if="user.role === 'user'"
                    class="admin-users__action"
                    :class="user.foundingMember ? 'admin-users__action--founder-active' : 'admin-users__action--founder'"
                    :title="user.foundingMember ? 'Quitar miembro fundador' : 'Marcar como miembro fundador'"
                    @click="emit('founding-member', user)"
                  >
                    <i class="fa-solid" :class="user.foundingMember ? 'fa-star' : 'fa-regular fa-star'" />
                  </button>
                  <button
                    v-if="user.role === 'user'"
                    class="admin-users__action admin-users__action--extend"
                    title="Extender acceso"
                    @click="emit('extend', user)"
                  >
                    <i class="fa-solid fa-calendar-plus" />
                  </button>
                  <button
                    v-if="user.role === 'user'"
                    class="admin-users__action admin-users__action--revoke"
                    title="Revocar acceso"
                    @click="emit('revoke', user)"
                  >
                    <i class="fa-solid fa-ban" />
                  </button>
                  <button
                    v-if="!isCurrentUser(user.id)"
                    class="admin-users__action admin-users__action--delete"
                    title="Eliminar usuario"
                    @click="emit('delete', user)"
                  >
                    <i class="fa-solid fa-trash" />
                  </button>
                  <span
                    v-else
                    class="admin-users__self-badge"
                    title="No puedes eliminar tu propia cuenta"
                  >
                    <i class="fa-solid fa-user-check" />
                    Tú
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Transition>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/admin-shared.scss';

@use './_users-table.scss';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
