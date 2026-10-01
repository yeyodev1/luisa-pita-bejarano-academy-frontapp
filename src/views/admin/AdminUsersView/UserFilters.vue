<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  role: string
  subscriptionStatus: string
}>()

const emit = defineEmits<{
  (e: 'update:role', value: string): void
  (e: 'update:subscriptionStatus', value: string): void
  (e: 'change'): void
  (e: 'reset'): void
}>()

const roleOptions = [
  { value: '', label: 'Todos los roles' },
  { value: 'user', label: 'Alumnos' },
  { value: 'admin', label: 'Administradores' },
]

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'none', label: 'Sin suscripción' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'expired', label: 'Vencido' },
]

const hasFilters = computed(() => props.role !== '' || props.subscriptionStatus !== '')

function onRoleChange(value: string | number) {
  emit('update:role', String(value))
  emit('change')
}

function onStatusChange(value: string | number) {
  emit('update:subscriptionStatus', String(value))
  emit('change')
}
</script>

<template>
  <section class="admin-users__toolbar">
    <div class="admin-users__filters">
      <div class="admin-users__filter">
        <i class="fa-solid fa-filter admin-users__filter-icon" />
        <AppSelect
          :model-value="role"
          :options="roleOptions"
          placeholder="Rol"
          @change="onRoleChange"
        />
      </div>
      <div class="admin-users__filter">
        <i class="fa-solid fa-circle-dot admin-users__filter-icon" />
        <AppSelect
          :model-value="subscriptionStatus"
          :options="statusOptions"
          placeholder="Estado"
          @change="onStatusChange"
        />
      </div>
      <button
        v-if="hasFilters"
        class="admin-users__btn admin-users__btn--ghost"
        @click="emit('reset')"
      >
        Limpiar
      </button>
    </div>
    <slot name="count" />
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/admin-shared.scss';

.admin-users__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.admin-users__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.admin-users__filter {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .app-select {
    min-width: 190px;
  }
}

.admin-users__filter-icon {
  color: $lpb-muted;
  font-size: 0.85rem;
}

@media (max-width: 720px) {
  .admin-users__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-users__filters {
    width: 100%;
  }

  .admin-users__filter {
    flex: 1 1 auto;
  }

  .admin-users__select {
    width: 100%;
    min-width: 0;
  }
}
</style>
