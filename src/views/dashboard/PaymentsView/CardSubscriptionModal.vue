<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  paymentService,
  type NuveiChargeResult,
  type NuveiSubscription,
} from '@/services/paymentService'
import {
  loadNuveiSdk,
  tokenFromAlreadyAddedError,
  type NuveiPaymentGateway,
  type NuveiTokenizeResponse,
} from '@/utils/nuveiSdk'
import { getPaymentPlan, type PaymentPlan } from '@/constants/paymentPlans'

/**
 * Suscripción con tarjeta guardada (Nuvei Recurrencia). El formulario lo pinta
 * el SDK de Nuvei dentro de #nuvei-card-form; nosotros solo recibimos el token.
 * mode "update-card" reemplaza la tarjeta de una suscripción existente.
 */
const props = defineProps<{
  open: boolean
  plan: PaymentPlan | null
  mode: 'subscribe' | 'update-card'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'done', payload: { charge: NuveiChargeResult | null; subscription: NuveiSubscription | null }): void
}>()

type Step = 'loading' | 'form' | 'otp' | 'processing' | 'error'

const step = ref<Step>('loading')
const error = ref('')
const formHint = ref('')
const otp = ref('')
const pendingCard = ref<{ token: string; transactionId: string } | null>(null)
let gateway: NuveiPaymentGateway | null = null

const planInfo = computed(() => (props.plan ? getPaymentPlan(props.plan) : null))
const title = computed(() => (props.mode === 'update-card' ? 'Cambiar tarjeta' : 'Suscripción automática'))

async function setup() {
  step.value = 'loading'
  error.value = ''
  formHint.value = ''
  otp.value = ''
  pendingCard.value = null
  try {
    const [{ data }, PaymentGateway] = await Promise.all([
      paymentService.subscriptionConfig(),
      loadNuveiSdk(),
    ])
    const config = data.data
    if (!config.enabled || !config.appCode || !config.appKey) {
      throw new Error('Las suscripciones con tarjeta aún no están disponibles.')
    }
    step.value = 'form'
    await nextTick()
    gateway = new PaymentGateway(config.environment, config.appCode, config.appKey)
    gateway.generate_tokenize(
      {
        locale: 'es',
        user: config.user,
        configuration: { default_country: 'ECU' },
      },
      '#nuvei-card-form',
      onTokenized,
      (message) => {
        formHint.value = message || 'Completa los datos de la tarjeta.'
        if (step.value === 'processing') step.value = 'form'
      },
    )
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'No se pudo cargar el formulario de pago.'
    step.value = 'error'
  }
}

function submitCard() {
  if (!gateway) return
  formHint.value = ''
  step.value = 'processing'
  gateway.tokenize()
}

async function onTokenized(response: NuveiTokenizeResponse) {
  const reused = tokenFromAlreadyAddedError(response)
  if (reused) return finish(reused)

  if (response.error || !response.card?.token) {
    formHint.value = response.error?.type || 'Nuvei no pudo guardar la tarjeta. Revisa los datos.'
    step.value = 'form'
    return
  }

  const card = response.card
  if (card.status === 'valid') return finish(card.token!)

  if (card.status === 'pending' && card.transaction_reference) {
    pendingCard.value = { token: card.token!, transactionId: card.transaction_reference }
    step.value = 'otp'
    return
  }

  error.value =
    card.status === 'review'
      ? 'Tu tarjeta quedó en revisión por seguridad. Intenta con otra tarjeta o escríbenos.'
      : card.message || 'La tarjeta fue rechazada. Intenta con otra tarjeta.'
  step.value = 'error'
}

async function submitOtp() {
  if (!pendingCard.value || !otp.value.trim()) return
  step.value = 'processing'
  try {
    await paymentService.verifyCard(pendingCard.value.transactionId, otp.value.trim())
    await finish(pendingCard.value.token)
  } catch (err: unknown) {
    formHint.value = (err as { message?: string }).message || 'El código no es válido.'
    step.value = 'otp'
  }
}

async function finish(cardToken: string) {
  step.value = 'processing'
  try {
    if (props.mode === 'update-card') {
      const { data } = await paymentService.updateSubscriptionCard(cardToken)
      emit('done', data.data)
      return
    }
    if (!props.plan) throw new Error('Elige un plan')
    const { data } = await paymentService.subscribe(props.plan, cardToken)
    const { charge } = data.data
    if (charge.status === 'failed') {
      error.value = charge.message || 'La tarjeta fue rechazada. Prueba con otra tarjeta.'
      step.value = 'error'
      return
    }
    emit('done', data.data)
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'No se pudo completar la suscripción.'
    step.value = 'error'
  }
}

function close() {
  if (step.value === 'processing') return
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) setup()
    else gateway = null
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="card-modal" role="dialog" aria-modal="true" @click.self="close">
        <div class="card-modal__panel">
          <header class="card-modal__header">
            <div>
              <h2 class="card-modal__title">{{ title }}</h2>
              <p v-if="planInfo && mode === 'subscribe'" class="card-modal__subtitle">
                {{ planInfo.label }} · USD {{ planInfo.price }} cada
                {{ planInfo.months === 1 ? 'mes' : `${planInfo.months} meses` }}
              </p>
            </div>
            <button class="card-modal__close" type="button" aria-label="Cerrar" :disabled="step === 'processing'" @click="close">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div v-if="step === 'loading'" class="card-modal__state">
            <i class="fa-solid fa-spinner fa-spin" /> Cargando formulario seguro…
          </div>

          <div v-show="step === 'form' || step === 'processing'" class="card-modal__body">
            <div id="nuvei-card-form" class="card-modal__form" />
            <p v-if="formHint" class="card-modal__hint card-modal__hint--error">{{ formHint }}</p>
            <p v-if="mode === 'subscribe'" class="card-modal__hint">
              Cobraremos USD {{ planInfo?.price }} hoy y se renovará automáticamente. Puedes cancelar cuando quieras
              desde esta página. Tus datos de tarjeta los procesa Nuvei; nosotros no los guardamos.
            </p>
            <button class="card-modal__btn" type="button" :disabled="step === 'processing'" @click="submitCard">
              <i v-if="step === 'processing'" class="fa-solid fa-spinner fa-spin" />
              {{ step === 'processing' ? 'Procesando…' : mode === 'update-card' ? 'Guardar tarjeta' : `Suscribirme y pagar USD ${planInfo?.price}` }}
            </button>
          </div>

          <form v-if="step === 'otp'" class="card-modal__body" @submit.prevent="submitOtp">
            <p class="card-modal__text">
              Tu banco te envió un código de verificación por SMS o correo. Ingrésalo para confirmar la tarjeta.
            </p>
            <input
              v-model="otp"
              class="card-modal__input"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="Código de verificación"
              maxlength="10"
            />
            <p v-if="formHint" class="card-modal__hint card-modal__hint--error">{{ formHint }}</p>
            <button class="card-modal__btn" type="submit" :disabled="!otp.trim()">Verificar y continuar</button>
          </form>

          <div v-if="step === 'error'" class="card-modal__body">
            <p class="card-modal__hint card-modal__hint--error">{{ error }}</p>
            <button class="card-modal__btn" type="button" @click="setup">Intentar de nuevo</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.card-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($lpb-black, 0.55);
  backdrop-filter: blur(6px);
}

.card-modal__panel {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba($lpb-black, 0.2);
}

.card-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-modal__title {
  font-family: $font-display;
  font-size: 1.4rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.card-modal__subtitle {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  margin: 0.25rem 0 0;
}

.card-modal__close {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: $lpb-graphite;

  &:hover:not(:disabled) {
    background: $lpb-cream;
  }
}

.card-modal__state {
  font-family: $font-sans;
  color: $lpb-graphite;
  padding: 2rem 0;
  text-align: center;
}

.card-modal__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.card-modal__form {
  min-height: 180px;
}

.card-modal__text,
.card-modal__hint {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-graphite;
  line-height: 1.5;
  margin: 0;

  &--error {
    color: $alert-error;
  }
}

.card-modal__input {
  font-family: $font-sans;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  text-align: center;
  color: $lpb-black;
  background: $lpb-cream;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;

  &:focus {
    outline: none;
    border-color: $lpb-green;
    box-shadow: 0 0 0 3px rgba($lpb-green, 0.15);
  }
}

.card-modal__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: $font-mono;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.95rem 1.25rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: $lpb-green-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
</style>
