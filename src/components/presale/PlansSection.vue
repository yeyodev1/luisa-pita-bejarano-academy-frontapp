<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { paymentService } from '@/services/paymentService'
import type { PaymentBoxConfig } from '@/services/paymentService'
import { PAYMENT_PLANS, getPaymentPlan, type PaymentPlan } from '@/constants/paymentPlans'
import CheckoutModal from './CheckoutModal.vue'

const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const selectedPlan = ref<PaymentPlan>('annual')
const boxConfig = ref<PaymentBoxConfig | null>(null)
const selectedPlanDetails = computed(() => getPaymentPlan(selectedPlan.value))

/**
 * Con Nuvei activo el único producto es la suscripción mensual con tarjeta
 * guardada, que se activa con cuenta desde Pagos. Si no, se venden los planes
 * de pago único con PayPhone como antes.
 */
const router = useRouter()
const route = useRoute()

/**
 * Plan de prueba de USD 1 para probar cobros reales. Solo se muestra con
 * ?prueba=1 y el precio real lo decide el servidor (solo correos autorizados
 * en NUVEI_TEST_EMAILS pagan USD 1).
 */
const showTestPlan = computed(() => route.query.prueba === '1')
const userStore = useUserStore()
const monthlyOnly = ref(false)
const monthly = getPaymentPlan('monthly')

onMounted(async () => {
  monthlyOnly.value = (await paymentService.nuveiHealth()).subscriptionsEnabled
})

function startSubscription() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'AddToCart', {
      content_name: 'Academia Luisa Pita Bejarano',
      content_type: 'product',
      value: monthly.price,
      currency: 'USD',
    })
  }
  router.push({ name: userStore.isAuthenticated ? 'payments' : 'subscribe' })
}

function openCheckout(plan: PaymentPlan) {
  selectedPlan.value = plan
  error.value = ''
  boxConfig.value = null
  showModal.value = true

  // Pixel: AddToCart al abrir el popup de pago
  if (typeof fbq !== 'undefined') {
    fbq('track', 'AddToCart', {
      content_name: 'Academia Luisa Pita Bejarano',
      content_type: 'product',
      value: getPaymentPlan(plan).price,
      currency: 'USD',
    })
  }
}

function closeCheckout() {
  showModal.value = false
  boxConfig.value = null
}

async function payWithCard(payload: { email: string; name: string; lastName: string }) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await paymentService.prepareBox({
      ...payload,
      plan: selectedPlan.value,
    })
    boxConfig.value = data.data
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al preparar el pago.'
  } finally {
    loading.value = false
  }
}

function onBoxError(message: string) {
  error.value = message
}
</script>

<template>
  <section id="planes" class="plans">
    <div class="plans__inner">
      <span class="eyebrow eyebrow--green">Elige tu compromiso</span>
      <h2 class="plans__title display-lg">Planes de la comunidad</h2>
      <p class="plans__lede">
        Todos los planes incluyen acceso completo a la academia. Elige el tiempo que mejor acompañe tu proceso.
      </p>

      <div v-if="monthlyOnly" class="plans__grid plans__grid--single">
        <article class="plan-card plan-card--featured">
          <div class="plan-card__badge">Suscripción mensual</div>
          <h3 class="plan-card__name">Acceso completo</h3>
          <p class="plan-card__description">
            Se renueva automáticamente cada mes con tu tarjeta. Cancelas cuando quieras.
          </p>
          <div class="plan-card__price">
            <span class="plan-card__currency">$</span>
            <span class="plan-card__amount">{{ monthly.price }}</span>
            <span class="plan-card__period">al mes</span>
          </div>
          <ul class="plan-card__features">
            <li><i class="fa-solid fa-check" /> Academia completa</li>
            <li><i class="fa-solid fa-check" /> Entrenamientos online</li>
            <li><i class="fa-solid fa-check" /> Guía de nutrición</li>
            <li><i class="fa-solid fa-check" /> Comunidad privada</li>
          </ul>
          <button type="button" class="plan-card__button plan-card__button--primary" @click="startSubscription">
            {{ userStore.isAuthenticated ? 'Activar mi suscripción' : 'Suscribirme ahora' }}
          </button>
          <RouterLink v-if="!userStore.isAuthenticated" :to="{ name: 'login' }" class="plan-card__login">
            Ya tengo cuenta
          </RouterLink>
        </article>

        <article v-if="showTestPlan" class="plan-card plan-card--test">
          <div class="plan-card__badge">Plan de prueba</div>
          <h3 class="plan-card__name">Prueba de pago</h3>
          <p class="plan-card__description">
            Cobro real de USD 1 para probar la pasarela. Solo para correos autorizados.
          </p>
          <div class="plan-card__price">
            <span class="plan-card__currency">$</span>
            <span class="plan-card__amount">1</span>
            <span class="plan-card__period">al mes</span>
          </div>
          <RouterLink :to="{ name: 'subscribe' }" class="plan-card__button plan-card__button--primary">
            Pagar USD 1
          </RouterLink>
        </article>
      </div>

      <div v-else class="plans__grid">
        <article
          v-for="plan in PAYMENT_PLANS"
          :key="plan.id"
          class="plan-card"
          :class="{ 'plan-card--featured': plan.id === 'annual' }"
        >
          <div v-if="plan.id === 'annual'" class="plan-card__badge">Mayor compromiso</div>
          <h3 class="plan-card__name">{{ plan.name }}</h3>
          <p class="plan-card__description">{{ plan.description }}</p>
          <div class="plan-card__price">
            <span class="plan-card__currency">$</span>
            <span class="plan-card__amount">{{ plan.price }}</span>
            <span class="plan-card__period">pago único</span>
          </div>
          <ul class="plan-card__features">
            <li><i class="fa-solid fa-check" /> Acceso por {{ plan.months }} {{ plan.months === 1 ? 'mes' : 'meses' }}</li>
            <li><i class="fa-solid fa-check" /> Entrenamientos online</li>
            <li><i class="fa-solid fa-check" /> Guía de nutrición</li>
            <li><i class="fa-solid fa-check" /> Comunidad privada</li>
          </ul>
          <button
            type="button"
            class="plan-card__button plan-card__button--primary"
            :disabled="loading"
            @click="openCheckout(plan.id)"
          >
            <span v-if="loading">Preparando pago...</span>
            <span v-else>Pagar con tarjeta</span>
          </button>
        </article>
      </div>
    </div>

    <CheckoutModal
      :open="showModal"
      :plan="selectedPlan"
      :price="selectedPlanDetails.price"
      :loading="loading"
      :error="error"
      :box-config="boxConfig"
      @close="closeCheckout"
      @submit="payWithCard"
      @box-error="onBoxError"
    />
  </section>
</template>

<style lang="scss" scoped>
.plans {
  padding-block: clamp(5rem, 12vw, 9rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  background: $lpb-paper;
}

.plans__inner {
  max-width: 1100px;
  margin-inline: auto;
  text-align: center;
}

.plans__title {
  margin: 0.75rem 0 0;
  color: $lpb-black;
}

.plans__grid--single {
  justify-content: center;

  .plan-card {
    flex: 1 1 320px;
    max-width: 420px;
  }
}

.plan-card--test {
  border: 2px dashed $lpb-amber;
}

.plan-card__login {
  display: block;
  margin-top: 0.85rem;
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  text-decoration: underline;
}

.plans__lede {
  font-family: $font-sans;
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  color: $lpb-muted;
  max-width: 60ch;
  margin: 1rem auto 3rem;
}

.plans__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: stretch;
}

.plan-card {
  position: relative;
  background: $lpb-white;
  border: 1px solid rgba($lpb-black, 0.06);
  border-radius: 1.5rem;
  padding: clamp(1.75rem, 4vw, 2.5rem);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 230px;
}

.plan-card--featured {
  border-color: rgba($lpb-green, 0.35);
  box-shadow: 0 24px 70px rgba($lpb-green, 0.1);
}

.plan-card__badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-green-dark;
  background: rgba($lpb-green, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;

  &--soon {
    color: $lpb-muted;
    background: rgba($lpb-black, 0.06);
  }
}

.plan-card--disabled {
  opacity: 0.85;
  background: rgba($lpb-white, 0.7);
}

.plan-card__name {
  font-family: $font-display;
  font-size: 1.75rem;
  font-weight: 400;
  margin: 0;
  color: $lpb-black;
}

.plan-card__description {
  font-family: $font-sans;
  font-size: 0.95rem;
  line-height: 1.5;
  color: $lpb-muted;
  margin: 0;
}

.plan-card__price {
  display: flex;
  align-items: flex-start;
  gap: 0.15rem;
  margin: 0.5rem 0;
}

.plan-card__currency {
  font-family: $font-display;
  font-size: 1.5rem;
  color: $lpb-black;
  margin-top: 0.25rem;
}

.plan-card__amount {
  font-family: $font-display;
  font-size: clamp(3rem, 7vw, 4rem);
  font-weight: 400;
  line-height: 1;
  color: $lpb-black;
}

.plan-card__period {
  font-family: $font-mono;
  font-size: 0.8rem;
  color: $lpb-muted;
  align-self: flex-end;
  margin-bottom: 0.6rem;
}

.plan-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: $font-sans;
    font-size: 0.95rem;
    color: $lpb-graphite;

    i {
      color: $lpb-green;
      font-size: 0.8rem;
    }
  }
}

.plan-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
  border: 1px solid transparent;

  &--primary {
    background: $lpb-black;
    color: $lpb-white;

    &:hover:not(:disabled) {
      background: $lpb-green-dark;
      transform: translateY(-2px);
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

</style>
