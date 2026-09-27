<script setup lang="ts">
import { ref } from 'vue'
import type { NuveiSavedCard } from '@/services/paymentService'
import TermsConsent from '@/components/payments/TermsConsent.vue'

defineProps<{
  amount: number
  defaultCard: NuveiSavedCard | null
  loading: boolean
  /** Si ya tiene acceso pagado: fecha del primer cobro (hoy no se cobra). */
  firstChargeLabel: string | null
}>()

const emit = defineEmits<{
  (e: 'subscribe'): void
}>()

const termsAccepted = ref(false)
const showTermsError = ref(false)

function subscribe() {
  if (!termsAccepted.value) {
    showTermsError.value = true
    return
  }
  emit('subscribe')
}
</script>

<template>
  <section class="monthly">
    <div class="monthly__copy">
      <span class="monthly__eyebrow">Acceso completo</span>
      <h3 class="monthly__title">Suscripción mensual</h3>
      <p class="monthly__text">
        Se cobra automáticamente cada mes a tu tarjeta principal. Cancelas la renovación cuando quieras y
        conservas el acceso hasta el final del mes pagado.
      </p>
      <ul class="monthly__features">
        <li><i class="fa-solid fa-check" /> Academia completa</li>
        <li><i class="fa-solid fa-check" /> Comunidad privada</li>
        <li><i class="fa-solid fa-check" /> Acceso inmediato</li>
      </ul>
    </div>

    <div class="monthly__buy">
      <div class="monthly__price">
        <span>USD</span>
        <strong>{{ amount }}</strong>
        <small>/ mes</small>
      </div>
      <p v-if="firstChargeLabel" class="monthly__today">
        Hoy pagas <strong>USD 0</strong>. Primer cobro: <strong>{{ firstChargeLabel }}</strong>
      </p>
      <TermsConsent v-model="termsAccepted" :amount="amount" :show-error="showTermsError" />
      <button class="monthly__btn" type="button" :disabled="loading" @click="subscribe">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-regular fa-credit-card'" />
        {{
          loading
            ? 'Procesando…'
            : firstChargeLabel
              ? defaultCard
                ? `Activar con •••• ${defaultCard.last4} (sin cobro hoy)`
                : 'Registrar mi tarjeta (sin cobro hoy)'
              : defaultCard
                ? `Suscribirme con •••• ${defaultCard.last4}`
                : 'Agregar tarjeta y suscribirme'
        }}
      </button>
      <small class="monthly__legal">IVA incluido. Pago procesado por Nuvei.</small>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.monthly {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: center;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.5rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.monthly__copy {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.monthly__eyebrow {
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.monthly__title {
  font-family: $font-display;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.monthly__text {
  font-family: $font-sans;
  font-size: 0.92rem;
  color: $lpb-graphite;
  line-height: 1.55;
  margin: 0;
}

.monthly__features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  font-family: $font-sans;
  font-size: 0.88rem;
  color: $lpb-graphite;

  i {
    color: $lpb-green-deep;
    margin-right: 0.3rem;
  }
}

.monthly__buy {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  min-width: 260px;
  max-width: 420px;
}

.monthly__price {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-family: $font-sans;
  color: $lpb-graphite;

  strong {
    font-family: $font-display;
    font-size: 2.6rem;
    font-weight: 400;
    color: $lpb-black;
  }
}

.monthly__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.95rem 1.25rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;

  &:hover:not(:disabled) {
    background: $lpb-green-dark;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.monthly__today {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-green-deep;
  background: rgba($lpb-green, 0.1);
  border-radius: 0.6rem;
  padding: 0.55rem 0.75rem;
  margin: 0;
}

.monthly__legal {
  font-family: $font-sans;
  font-size: 0.75rem;
  color: $lpb-muted;
  text-align: center;
}
</style>
