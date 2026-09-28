<script setup lang="ts">
import { computed } from 'vue'
import type { NuveiSubscription } from '@/services/paymentService'
import { paymentPlanLabel } from '@/constants/paymentPlans'

const props = defineProps<{ subscription: NuveiSubscription }>()

const emit = defineEmits<{
  (e: 'update-card'): void
  (e: 'cancel'): void
}>()

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
}

const statusCopy = computed(() => {
  switch (props.subscription.status) {
    case 'active':
      return { label: 'Activa', tone: 'ok', text: `Próximo cobro el ${formatDate(props.subscription.nextChargeAt)}.` }
    case 'past_due':
      return {
        label: 'Pago pendiente',
        tone: 'warn',
        text: `No pudimos cobrar la renovación. Reintentaremos el ${formatDate(props.subscription.nextChargeAt)}. Puedes cambiar tu tarjeta para cobrar ahora.`,
      }
    default:
      return { label: 'Cancelada', tone: 'muted', text: 'No se harán más cobros a tu tarjeta.' }
  }
})

const card = computed(() =>
  props.subscription.cardLast4
    ? `${(props.subscription.cardBrand || 'Tarjeta').toUpperCase()} •••• ${props.subscription.cardLast4}`
    : 'Tarjeta guardada',
)
</script>

<template>
  <section class="sub">
    <div class="sub__head">
      <div>
        <span class="sub__eyebrow">Suscripción automática</span>
        <h3 class="sub__title">{{ paymentPlanLabel(subscription.plan) }} · USD {{ subscription.amount }}</h3>
      </div>
      <span class="sub__badge" :class="`sub__badge--${statusCopy.tone}`">{{ statusCopy.label }}</span>
    </div>

    <p class="sub__text">{{ statusCopy.text }}</p>

    <div class="sub__meta">
      <span><i class="fa-regular fa-credit-card" /> {{ card }}</span>
      <span v-if="subscription.lastChargeAt">Último cobro: {{ formatDate(subscription.lastChargeAt) }}</span>
    </div>

    <div v-if="subscription.status !== 'canceled'" class="sub__actions">
      <button class="sub__btn" type="button" @click="emit('update-card')">Cambiar tarjeta</button>
      <button class="sub__btn sub__btn--ghost" type="button" @click="emit('cancel')">Cancelar renovación</button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.sub {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
}

.sub__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.sub__eyebrow {
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sub__title {
  font-family: $font-display;
  font-size: 1.25rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0.2rem 0 0;
}

.sub__badge {
  flex-shrink: 0;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;

  &--ok {
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
  }

  &--warn {
    background: rgba($lpb-amber, 0.15);
    color: darken($lpb-amber, 20%);
  }

  &--muted {
    background: $lpb-cream;
    color: $lpb-muted;
  }
}

.sub__text {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  margin: 0;
  line-height: 1.5;
}

.sub__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-muted;

  i {
    margin-right: 0.3rem;
  }
}

.sub__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.sub__btn {
  font-family: $font-mono;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;

  &:hover {
    background: $lpb-green-dark;
  }

  &--ghost {
    background: transparent;
    color: $lpb-graphite;
    border: 1px solid var(--border);

    &:hover {
      background: $lpb-cream;
    }
  }
}
</style>
