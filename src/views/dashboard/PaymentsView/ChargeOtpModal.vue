<script setup lang="ts">
import { ref, watch } from 'vue'
import { paymentService, type NuveiChargeResult, type NuveiSubscription } from '@/services/paymentService'

/**
 * Algunos bancos (p. ej. Diners) piden un código OTP para confirmar el cobro.
 * Se ingresa aquí y el backend termina el pago con Nuvei.
 */
const props = defineProps<{ paymentId: string | null }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'done', payload: { charge: NuveiChargeResult; subscription: NuveiSubscription | null }): void
}>()

const otp = ref('')
const error = ref('')
const loading = ref(false)

watch(
  () => props.paymentId,
  () => {
    otp.value = ''
    error.value = ''
  },
)

async function submit() {
  if (!props.paymentId || !otp.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await paymentService.verifyChargeOtp(props.paymentId, otp.value.trim())
    emit('done', data.data)
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'El código no es correcto.'
    otp.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="paymentId" class="otp-modal" role="dialog" aria-modal="true">
      <form class="otp-modal__panel" @submit.prevent="submit">
        <h2 class="otp-modal__title">Confirma tu pago</h2>
        <p class="otp-modal__text">
          Tu banco te envió un código de verificación por SMS o correo. Ingrésalo para confirmar el pago de tu suscripción.
        </p>
        <input
          v-model="otp"
          class="otp-modal__input"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="10"
          placeholder="Código"
        />
        <p v-if="error" class="otp-modal__error">{{ error }}</p>
        <div class="otp-modal__actions">
          <button type="button" class="otp-modal__btn otp-modal__btn--ghost" :disabled="loading" @click="emit('close')">
            Cancelar
          </button>
          <button type="submit" class="otp-modal__btn" :disabled="loading || !otp.trim()">
            <i v-if="loading" class="fa-solid fa-spinner fa-spin" />
            {{ loading ? 'Verificando…' : 'Confirmar pago' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.otp-modal {
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

.otp-modal__panel {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba($lpb-black, 0.2);
}

.otp-modal__title {
  font-family: $font-display;
  font-size: 1.4rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.otp-modal__text,
.otp-modal__error {
  font-family: $font-sans;
  font-size: 0.9rem;
  line-height: 1.5;
  color: $lpb-graphite;
  margin: 0;
}

.otp-modal__error {
  color: $alert-error;
}

.otp-modal__input {
  font-family: $font-sans;
  font-size: 1.2rem;
  letter-spacing: 0.25em;
  text-align: center;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background: $lpb-cream;
}

.otp-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.otp-modal__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.75rem 1.2rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;

  &--ghost {
    background: transparent;
    color: $lpb-graphite;
    border: 1px solid var(--border);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
