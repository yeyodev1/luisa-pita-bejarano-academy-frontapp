<script setup lang="ts">
defineProps<{ loading?: boolean; error?: string; empty?: boolean; emptyText?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="loading" class="api-state" aria-live="polite"><span class="api-state__spinner" /> Cargando...</div>
  <div v-else-if="error" class="api-state api-state--error">
    <p>{{ error }}</p><button type="button" @click="$emit('retry')">Reintentar</button>
  </div>
  <div v-else-if="empty" class="api-state"><p>{{ emptyText || 'Todavía no hay contenido disponible.' }}</p></div>
  <slot v-else />
</template>

<style lang="scss" scoped>
.api-state { min-height: 180px; display: flex; align-items: center; justify-content: center; gap: .7rem; flex-direction: column; padding: 2rem; border: 1px dashed var(--border); border-radius: 1rem; color: $lpb-muted; font-family: $font-sans; text-align: center; background: rgba($lpb-white, .5); }
.api-state p { margin: 0; }
.api-state button { padding: .65rem 1rem; border-radius: 999px; background: $lpb-black; color: $lpb-white; font: 600 .72rem $font-mono; text-transform: uppercase; }
.api-state__spinner { width: 20px; height: 20px; border: 2px solid rgba($lpb-black,.15); border-top-color: $lpb-green-deep; border-radius: 50%; animation: spin .8s linear infinite; }
.api-state--error { color: $alert-error; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
