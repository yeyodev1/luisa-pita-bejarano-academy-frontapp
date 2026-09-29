<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { paymentService, type NuveiGuestCheckout } from '@/services/paymentService'
import {
  loadNuveiSdk,
  nuveiMessageEs,
  tokenFromAlreadyAddedError,
  type NuveiPaymentGateway,
  type NuveiTokenizeResponse,
} from '@/utils/nuveiSdk'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'
import SecureCardFrame from '@/components/payments/SecureCardFrame.vue'
import TermsConsent from '@/components/payments/TermsConsent.vue'
import { saveCheckoutDone } from '@/utils/checkoutDone'

/**
 * Suscripción mensual sin iniciar sesión: datos → tarjeta → listo. La cuenta
 * se crea por detrás y el acceso llega por correo (ver /suscripcion-activa).
 */
const router = useRouter()
const userStore = useUserStore()

type Step = 'details' | 'card' | 'otp' | 'processing'

const step = ref<Step>('details')
const amount = ref(47)
const form = ref({ name: '', lastName: '', email: '' })
const error = ref('')
const existingAccount = ref(false)
const cardHint = ref('')
const otp = ref('')
const pendingCard = ref<{ token: string; transactionId: string } | null>(null)
/** Cobro esperando el código del banco (Diners, por ejemplo). */
const pendingChargeId = ref<string | null>(null)
const checkout = ref<NuveiGuestCheckout | null>(null)
const submitting = ref(false)
const termsAccepted = ref(false)
const showTermsError = ref(false)
let gateway: NuveiPaymentGateway | null = null

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string }).message || fallback
}

async function startCheckout() {
  error.value = ''
  existingAccount.value = false
  submitting.value = true
  try {
    const [{ data }, PaymentGateway] = await Promise.all([
      paymentService.checkoutStart({
        name: form.value.name.trim(),
        lastName: form.value.lastName.trim(),
        email: form.value.email.trim(),
      }),
      loadNuveiSdk(),
    ])
    checkout.value = data.data
    amount.value = data.data.amount
    if (!data.data.appCode || !data.data.appKey) throw new Error('El pago con tarjeta no está disponible.')

    if (typeof fbq !== 'undefined') {
      fbq('track', 'InitiateCheckout', { value: amount.value, currency: 'USD' })
    }

    step.value = 'card'
    await nextTick()
    gateway = new PaymentGateway(data.data.environment, data.data.appCode, data.data.appKey)
    gateway.generate_tokenize(
      { locale: 'es', user: data.data.user, configuration: { default_country: 'ECU' } },
      '#checkout-card-form',
      onTokenized,
      (message) => {
        cardHint.value = nuveiMessageEs(message, 'Completa los datos de la tarjeta.')
        step.value = 'card'
      },
    )
  } catch (err: unknown) {
    const e = err as { status?: number }
    existingAccount.value = e.status === 409
    error.value = errorMessage(err, 'No pudimos iniciar el pago. Intenta de nuevo.')
  } finally {
    submitting.value = false
  }
}

function pay() {
  if (!gateway) return
  if (!termsAccepted.value) {
    showTermsError.value = true
    return
  }
  cardHint.value = ''
  step.value = 'processing'
  gateway.tokenize()
}

async function onTokenized(response: NuveiTokenizeResponse) {
  const reused = tokenFromAlreadyAddedError(response)
  if (reused) return complete(reused)

  if (response.error || !response.card?.token) {
    cardHint.value = nuveiMessageEs(response.error?.type, 'No pudimos procesar la tarjeta. Revisa los datos.')
    step.value = 'card'
    return
  }

  const card = response.card
  if (card.status === 'valid') return complete(card.token!)

  if (card.status === 'pending' && card.transaction_reference) {
    pendingCard.value = { token: card.token!, transactionId: card.transaction_reference }
    otp.value = ''
    step.value = 'otp'
    return
  }

  cardHint.value =
    card.status === 'review'
      ? 'Tu tarjeta quedó en revisión por seguridad. Prueba con otra tarjeta o escríbenos.'
      : nuveiMessageEs(card.message, 'La tarjeta fue rechazada. Prueba con otra tarjeta.')
  step.value = 'card'
}

async function submitOtp() {
  if (!checkout.value || !otp.value.trim()) return
  if (pendingChargeId.value) return submitChargeOtp()
  if (!pendingCard.value) return
  step.value = 'processing'
  try {
    await paymentService.checkoutVerifyCard(
      checkout.value.checkoutToken,
      pendingCard.value.transactionId,
      otp.value.trim(),
    )
    await complete(pendingCard.value.token)
  } catch (err: unknown) {
    cardHint.value = errorMessage(err, 'El código no es válido.')
    step.value = 'otp'
  }
}

async function submitChargeOtp() {
  if (!checkout.value || !pendingChargeId.value) return
  step.value = 'processing'
  try {
    const { data } = await paymentService.checkoutVerifyChargeOtp(
      checkout.value.checkoutToken,
      pendingChargeId.value,
      otp.value.trim(),
    )
    finish(data.data)
  } catch (err: unknown) {
    cardHint.value = errorMessage(err, 'El código no es correcto.')
    otp.value = ''
    step.value = 'otp'
  }
}

function finish(result: Awaited<ReturnType<typeof paymentService.checkoutComplete>>['data']['data']) {
  if (result.status === 'otp_required' && result.paymentId) {
    pendingChargeId.value = result.paymentId
    pendingCard.value = null
    otp.value = ''
    cardHint.value = ''
    step.value = 'otp'
    return
  }
  if (result.status === 'failed' || result.status === 'otp_required') {
    pendingChargeId.value = null
    cardHint.value = result.message || 'La tarjeta fue rechazada. Prueba con otra tarjeta.'
    step.value = 'card'
    return
  }
  const email = result.email || form.value.email.trim()
  saveCheckoutDone({
    email,
    status: result.status,
    firstChargeAt: result.firstChargeAt ?? null,
    receipt: result.receipt ?? null,
  })
  router.replace({ name: 'subscription-welcome', query: { email } })
}

async function complete(cardToken: string) {
  if (!checkout.value) return
  step.value = 'processing'
  try {
    const { data } = await paymentService.checkoutComplete(checkout.value.checkoutToken, cardToken)
    finish(data.data)
  } catch (err: unknown) {
    const e = err as { status?: number }
    if (e.status === 401) {
      error.value = errorMessage(err, 'Tu sesión de pago expiró.')
      step.value = 'details'
      return
    }
    cardHint.value = errorMessage(err, 'No pudimos completar el pago. Intenta de nuevo.')
    step.value = 'card'
  }
}

function editDetails() {
  gateway = null
  checkout.value = null
  cardHint.value = ''
  step.value = 'details'
}

onMounted(() => {
  if (userStore.isAuthenticated) router.replace({ name: 'payments' })
})
</script>

<template>
  <main class="checkout">
    <aside class="checkout__summary">
      <RouterLink :to="{ name: 'home' }" class="checkout__brand"><BrandWordmark size="sm" /></RouterLink>
      <span class="checkout__eyebrow">Suscripción mensual</span>
      <h1 class="checkout__title">Academia Luisa Pita Bejarano</h1>
      <div class="checkout__price">
        <span>USD</span><strong>{{ amount }}</strong><small>/ mes</small>
      </div>
      <ul class="checkout__features">
        <li><i class="fa-solid fa-check" /> Academia completa y entrenamientos online</li>
        <li><i class="fa-solid fa-check" /> Guía de nutrición y comunidad privada</li>
        <li><i class="fa-solid fa-check" /> Acceso inmediato; te llega por correo</li>
        <li><i class="fa-solid fa-check" /> Se renueva cada mes. Cancelas cuando quieras</li>
      </ul>
      <p class="checkout__secure"><i class="fa-solid fa-lock" /> Pago seguro procesado por Nuvei. IVA incluido.</p>
    </aside>

    <section class="checkout__panel">
      <ol class="checkout__steps" aria-label="Pasos">
        <li :class="{ 'is-active': step === 'details', 'is-done': step !== 'details' }">1. Tus datos</li>
        <li :class="{ 'is-active': step !== 'details' }">2. Tarjeta</li>
      </ol>

      <form v-if="step === 'details'" class="checkout__form" @submit.prevent="startCheckout">
        <h2 class="checkout__heading">Crea tu acceso</h2>
        <p class="checkout__lede">No necesitas contraseña ahora: te enviaremos el acceso a tu correo.</p>

        <div class="checkout__row">
          <label class="checkout__field">
            <span>Nombre</span>
            <input v-model="form.name" required autocomplete="given-name" placeholder="Tu nombre" />
          </label>
          <label class="checkout__field">
            <span>Apellido</span>
            <input v-model="form.lastName" required autocomplete="family-name" placeholder="Tu apellido" />
          </label>
        </div>
        <label class="checkout__field">
          <span>Correo electrónico</span>
          <input v-model="form.email" required type="email" autocomplete="email" placeholder="tu@email.com" />
          <small>Revisa que esté bien escrito: ahí llegará tu acceso.</small>
        </label>

        <p v-if="error" class="checkout__error">
          {{ error }}
          <RouterLink v-if="existingAccount" :to="{ name: 'login' }">Iniciar sesión</RouterLink>
        </p>

        <button class="checkout__btn" type="submit" :disabled="submitting">
          <i v-if="submitting" class="fa-solid fa-spinner fa-spin" />
          {{ submitting ? 'Preparando…' : 'Continuar al pago' }}
        </button>
        <p class="checkout__alt">¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink></p>
      </form>

      <div v-else class="checkout__form">
        <div class="checkout__who">
          <span>Tu acceso llegará a <strong>{{ checkout?.user.email }}</strong></span>
          <button type="button" :disabled="step === 'processing'" @click="editDetails">Cambiar</button>
        </div>

        <div v-show="step === 'card' || step === 'processing'" class="checkout__card-step">
          <h2 class="checkout__heading">Datos de tu tarjeta</h2>
          <SecureCardFrame
            container-id="checkout-card-form"
            :environment="checkout?.environment"
            :processing="step === 'processing'"
          />
          <p v-if="cardHint" class="checkout__error">{{ cardHint }}</p>

          <TermsConsent v-model="termsAccepted" :amount="amount" :show-error="showTermsError" />

          <dl class="checkout__total">
            <div>
              <dt>Suscripción mensual</dt>
              <dd>USD {{ amount.toFixed(2) }} / mes</dd>
            </div>
            <div class="checkout__total-today">
              <dt>Total a pagar hoy</dt>
              <dd>USD {{ amount.toFixed(2) }}</dd>
            </div>
            <p>IVA incluido · Se renueva cada mes · Cancelas cuando quieras</p>
          </dl>

          <button class="checkout__btn" type="button" :disabled="step === 'processing'" @click="pay">
            <i :class="step === 'processing' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'" />
            {{ step === 'processing' ? 'Procesando pago…' : `Pagar USD ${amount.toFixed(2)} de forma segura` }}
          </button>
          <p class="checkout__fine">
            Si este correo ya tiene acceso pagado, hoy no se cobra nada: el primer cobro será cuando venza tu acceso.
          </p>
        </div>

        <form v-if="step === 'otp'" class="checkout__otp" @submit.prevent="submitOtp">
          <h2 class="checkout__heading">{{ pendingChargeId ? 'Confirma tu pago' : 'Confirma tu tarjeta' }}</h2>
          <p class="checkout__lede">
            Tu banco te envió un código por SMS o correo. Ingrésalo para
            {{ pendingChargeId ? 'confirmar el pago de tu suscripción' : 'continuar' }}.
          </p>
          <input
            v-model="otp"
            class="checkout__otp-input"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="10"
            placeholder="Código"
          />
          <p v-if="cardHint" class="checkout__error">{{ cardHint }}</p>
          <button class="checkout__btn" type="submit" :disabled="!otp.trim()">Verificar y pagar</button>
        </form>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.checkout {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  background: $lpb-paper;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
}

.checkout__summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(2rem, 6vw, 4.5rem);
  background: $lpb-black;
  color: $lpb-white;
}

.checkout__brand {
  color: $lpb-white;
  margin-bottom: 1rem;
}

.checkout__eyebrow {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $lpb-green;
}

.checkout__title {
  font-family: $font-display;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 400;
  line-height: 1.1;
  margin: 0;
}

.checkout__price {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: $font-sans;
  color: rgba($lpb-white, 0.7);

  strong {
    font-family: $font-display;
    font-size: 3.4rem;
    font-weight: 400;
    color: $lpb-white;
  }
}

.checkout__features {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  font-family: $font-sans;
  font-size: 0.95rem;
  color: rgba($lpb-white, 0.85);

  i {
    color: $lpb-green;
    margin-right: 0.5rem;
  }
}

.checkout__secure {
  margin-top: auto;
  padding-top: 1.5rem;
  font-family: $font-sans;
  font-size: 0.82rem;
  color: rgba($lpb-white, 0.6);

  i {
    margin-right: 0.35rem;
  }
}

// En celular el resumen se compacta para que el formulario se vea sin bajar.
@media (max-width: 880px) {
  .checkout__summary {
    gap: 0.5rem;
    padding: 1.5rem 1.25rem;
  }

  .checkout__brand {
    margin-bottom: 0.5rem;
  }

  .checkout__title {
    font-size: 1.35rem;
  }

  .checkout__price strong {
    font-size: 2.4rem;
  }

  .checkout__features {
    display: none;
  }

  .checkout__secure {
    margin-top: 0;
    padding-top: 0.25rem;
  }

  .checkout__panel {
    padding: 1.5rem 1.25rem 2.5rem;
  }
}

.checkout__panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(2rem, 6vw, 4.5rem);
  max-width: 620px;
  width: 100%;
  justify-self: center;
}

.checkout__steps {
  display: flex;
  gap: 1.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: $font-mono;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-muted;

  .is-active {
    color: $lpb-black;
  }

  .is-done {
    color: $lpb-green-deep;
  }
}

.checkout__form,
.checkout__otp {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout__heading {
  font-family: $font-display;
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.checkout__lede,
.checkout__fine,
.checkout__alt {
  font-family: $font-sans;
  font-size: 0.9rem;
  line-height: 1.5;
  color: $lpb-graphite;
  margin: 0;
}

.checkout__fine {
  font-size: 0.8rem;
  color: $lpb-muted;
  margin-top: 0.75rem;
}

.checkout__alt a,
.checkout__error a {
  color: $lpb-black;
  font-weight: 600;
  text-decoration: underline;
  margin-left: 0.25rem;
}

.checkout__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.checkout__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-family: $font-sans;

  span {
    font-family: $font-mono;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $lpb-graphite;
  }

  small {
    font-size: 0.78rem;
    color: $lpb-muted;
  }

  input {
    font-family: $font-sans;
    font-size: 1rem;
    color: $lpb-black;
    background: $lpb-white;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 0.85rem 1rem;

    &:focus {
      outline: none;
      border-color: $lpb-green;
      box-shadow: 0 0 0 3px rgba($lpb-green, 0.15);
    }
  }
}

.checkout__who {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;

  button {
    font-family: $font-mono;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $lpb-black;
    text-decoration: underline;
  }
}

.checkout__card-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout__total {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;
  padding: 1rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: $lpb-white;
  font-family: $font-sans;

  div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.9rem;
    color: $lpb-graphite;
  }

  dt,
  dd {
    margin: 0;
  }

  p {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    color: $lpb-muted;
  }
}

.checkout__total-today {
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border);
  font-weight: 700;
  color: $lpb-black !important;

  dd {
    font-size: 1.05rem;
  }
}

.checkout__otp-input {
  font-family: $font-sans;
  font-size: 1.2rem;
  letter-spacing: 0.25em;
  text-align: center;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background: $lpb-white;
}

.checkout__error {
  font-family: $font-sans;
  font-size: 0.88rem;
  color: $alert-error;
  background: rgba($alert-error, 0.07);
  border-radius: 0.6rem;
  padding: 0.7rem 0.9rem;
  margin: 0;
}

.checkout__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  font-family: $font-mono;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 1.05rem 1.25rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: $lpb-green-dark;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}
</style>
