<script setup lang="ts">
import { PAYMENT_PLANS, type PaymentPlan } from '@/constants/paymentPlans'

defineProps<{ loading: boolean }>()

const emit = defineEmits<{
  (e: 'pay', plan: PaymentPlan): void
  (e: 'open-transfer'): void
}>()
</script>

<template>
  <section class="plans">
    <div class="plans__heading">
      <span class="plans__eyebrow">Acceso completo</span>
      <h3 class="plans__title">Elige la duración de tu plan</h3>
      <p class="plans__intro">Un solo pago, sin renovación automática.</p>
    </div>

    <div class="plans__list">
      <article
        v-for="plan in PAYMENT_PLANS"
        :key="plan.id"
        class="plan"
        :class="{ 'plan--featured': plan.id === 'annual' }"
      >
        <span v-if="plan.id === 'annual'" class="plan__badge">Mayor compromiso</span>
        <span class="plan__duration">{{ plan.name }}</span>
        <div class="plan__pricing">
          <span class="plan__currency">USD</span>
          <strong class="plan__price">{{ plan.price }}</strong>
        </div>
        <p class="plan__description">{{ plan.description }}</p>
        <ul class="plan__features">
          <li><i class="fa-solid fa-check" /> Academia completa</li>
          <li><i class="fa-solid fa-check" /> Comunidad privada</li>
          <li><i class="fa-solid fa-check" /> Acceso inmediato</li>
        </ul>
        <button class="plan__button" :disabled="loading" @click="emit('pay', plan.id)">
          <i class="fa-regular fa-credit-card" />
          {{ loading ? 'Preparando...' : 'Pagar con PayPhone' }}
        </button>
        <button
          v-if="plan.id === 'annual'"
          type="button"
          class="plan__transfer"
          @click="emit('open-transfer')"
        >
          Consultar pago por transferencia
        </button>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.plans,
.plans__heading,
.plan,
.plan__features {
  display: flex;
  flex-direction: column;
}

.plans { gap: 1.25rem; }
.plans__heading { gap: 0.35rem; }

.plans__eyebrow {
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.plans__title {
  color: $lpb-black;
  font-family: $font-display;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  font-weight: 400;
  margin: 0;
}

.plans__intro {
  color: $lpb-graphite;
  font-family: $font-sans;
  margin: 0;
}

.plans__list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: stretch;
}

.plan {
  position: relative;
  flex: 1 1 210px;
  gap: 1rem;
  min-width: 0;
  padding: 1.6rem 1.25rem 1.25rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 1.25rem;

  &--featured {
    background: rgba($lpb-green, 0.08);
    border-color: $lpb-green;
    box-shadow: 0 14px 34px rgba($lpb-green-deep, 0.12);
  }
}

.plan__badge {
  position: absolute;
  top: -0.65rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  color: $lpb-black;
  background: $lpb-green;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.plan__duration {
  color: $lpb-black;
  font-family: $font-display;
  font-size: 1.25rem;
}

.plan__pricing {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.plan__currency {
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
}

.plan__price {
  color: $lpb-black;
  font-family: $font-display;
  font-size: 2.75rem;
  font-weight: 500;
  line-height: 1;
}

.plan__description {
  flex: 1 1 auto;
  color: $lpb-graphite;
  font-family: $font-sans;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}

.plan__features {
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: $lpb-black;
    font-family: $font-sans;
    font-size: 0.82rem;
  }

  i { color: $lpb-green-deep; }
}

.plan__button,
.plan__transfer {
  width: 100%;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.plan__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  color: $lpb-white;
  background: $lpb-green-deep;
  border-radius: 999px;

  &:hover:not(:disabled) { background: $lpb-black; }
  &:disabled { cursor: not-allowed; opacity: 0.55; }
}

.plan__transfer {
  color: $lpb-green-deep;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

@media (max-width: 560px) {
  .plan { flex-basis: 100%; }
}
</style>
