<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  subscriptionStatus: string
  accessUntilLabel: string
  foundingMember: boolean
}>()

function statusLabel(s: string) {
  switch (s) {
    case 'active': return 'Activa'
    case 'pending': return 'Pendiente'
    case 'canceled': return 'Cancelada'
    case 'expired': return 'Vencida'
    default: return 'Sin suscripción activa'
  }
}

function isActive(s: string) {
  return s === 'active'
}

function isExpired(s: string) {
  return s === 'expired'
}
</script>

<template>
  <section class="card">
    <h2 class="card__title">Información de suscripción</h2>

    <Transition name="sub-state" mode="out-in">
    <div :key="subscriptionStatus" class="card__state">
    <template v-if="isActive(subscriptionStatus)">
      <div class="grid">
        <div class="item">
          <span class="item__label">Estado</span>
          <span class="item__value item__value--active">{{ statusLabel(subscriptionStatus) }}</span>
        </div>
        <div class="item">
          <span class="item__label">Acceso hasta</span>
          <span class="item__value">{{ accessUntilLabel }}</span>
        </div>
        <div v-if="foundingMember" class="item">
          <span class="item__label">Miembro fundador</span>
          <span class="item__value item__value--active">Sí</span>
        </div>
      </div>
    </template>

    <template v-else-if="isExpired(subscriptionStatus)">
      <div class="grid">
        <div class="item">
          <span class="item__label">Estado</span>
          <span class="item__value item__value--expired">{{ statusLabel(subscriptionStatus) }}</span>
        </div>
        <div class="item">
          <span class="item__label">Venció el</span>
          <span class="item__value">{{ accessUntilLabel }}</span>
        </div>
      </div>
      <p class="none__sub">Renueva tu plan para recuperar el acceso a la plataforma.</p>
      <RouterLink :to="{ name: 'payments' }" class="none__cta">Renovar suscripción</RouterLink>
    </template>

    <template v-else>
      <p class="none">Aún no tienes una suscripción activa.</p>
      <p class="none__sub">Elige un plan y obtén acceso completo a la plataforma.</p>
      <RouterLink :to="{ name: 'payments' }" class="none__cta">Ver suscripciones</RouterLink>
    </template>
    </div>
    </Transition>
  </section>
</template>

<style lang="scss" scoped>
.card {
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__title {
    font-family: $font-display;
    font-size: 1.25rem;
    font-weight: 400;
    color: $lpb-black;
    margin: 0;
  }

  &__state {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
}

/* El estado puede cambiar solo al vencer el acceso; la transición evita que
   la tarjeta salte de "Activa" a "Vencida" sin aviso visual. */
.sub-state-enter-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.2, 0.7, 0, 1);
}

.sub-state-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sub-state-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.sub-state-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .sub-state-enter-active,
  .sub-state-leave-active {
    transition: opacity 0.2s ease;
  }

  .sub-state-enter-from,
  .sub-state-leave-to {
    transform: none;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: $lpb-cream;
  border-radius: 0.75rem;

  &__label {
    font-family: $font-mono;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: $lpb-muted;
  }

  &__value {
    font-family: $font-sans;
    font-size: 1rem;
    font-weight: 600;
    color: $lpb-black;

    &--active { color: $lpb-green-deep; }

    &--expired {
      color: $alert-error;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      &::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        animation: sub-pulse 2s ease-in-out infinite;
      }
    }
  }
}

@keyframes sub-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.82); }
}

@media (prefers-reduced-motion: reduce) {
  .item__value--expired::before { animation: none; }
}

.none {
  font-family: $font-sans;
  font-size: 1rem;
  font-weight: 600;
  color: $lpb-graphite;
  margin: 0;

  &__sub {
    font-family: $font-sans;
    font-size: 0.85rem;
    color: $lpb-muted;
    margin: 0;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    background: $lpb-black;
    color: $lpb-white;
    font-family: $font-mono;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.85rem 1.5rem;
    border-radius: 999px;
    transition: background 0.2s ease;

    &:hover { background: $lpb-green-dark; }
  }
}
</style>
