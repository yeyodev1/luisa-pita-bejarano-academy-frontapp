<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentService } from '@/services/paymentService'
import type { ConfirmPaymentResponse } from '@/services/paymentService'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthSubmit from '@/components/auth/AuthSubmit.vue'

const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')
const credentials = ref<Pick<ConfirmPaymentResponse, 'isNewUser' | 'plainPassword' | 'emailSent' | 'email'> | null>(null)
const clientTxId = ref('')
const sending = ref(false)
const resendOk = ref(false)
const resendError = ref('')

onMounted(async () => {
  const id = route.query.id
  const clientTransactionId = route.query.clientTransactionId

  if (!id || !clientTransactionId || typeof id !== 'string' || typeof clientTransactionId !== 'string') {
    status.value = 'error'
    message.value = 'Los datos de la transacción no son válidos.'
    return
  }

  clientTxId.value = clientTransactionId

  try {
    const { data } = await paymentService.confirmPayment(id, clientTransactionId)
    const result = data.data
    status.value = result.status === 'approved' ? 'success' : 'error'
    message.value = result.status === 'approved'
      ? 'Tu pago fue procesado correctamente. Bienvenida a la comunidad.'
      : 'No pudimos confirmar tu pago. Contacta a soporte si el cargo fue realizado.'

    if (result.isNewUser) {
      credentials.value = {
        isNewUser: result.isNewUser,
        plainPassword: result.plainPassword,
        emailSent: result.emailSent,
        email: result.email,
      }
    }
  } catch (err: unknown) {
    status.value = 'error'
    const e = err as { message?: string }
    message.value = e.message || 'Ocurrió un error al confirmar el pago.'
  }
})

const goHome = () => router.push({ name: 'home' })
const goLogin = () => router.push({ name: 'login' })

const resendEmail = async () => {
  if (!clientTxId.value || sending.value) return
  sending.value = true
  resendOk.value = false
  resendError.value = ''
  try {
    await paymentService.resendWelcome(clientTxId.value)
    resendOk.value = true
  } catch (err: unknown) {
    const e = err as { message?: string }
    resendError.value = e.message || 'Error al reenviar el correo.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <AuthLayout title="Confirmación de pago" :subtitle="message || 'Estamos confirmando tu transacción...'">
    <div class="payment-state">
      <div v-if="status === 'loading'" class="payment-state__spinner" aria-hidden="true" />
      <div v-else-if="status === 'success'" class="payment-state__icon payment-state__icon--success">
        <i class="fa-solid fa-check" />
      </div>
      <div v-else class="payment-state__icon payment-state__icon--error">
        <i class="fa-solid fa-xmark" />
      </div>

      <div v-if="credentials" class="payment-state__creds">
        <p class="payment-state__creds-label">Tus credenciales de acceso:</p>
        <div class="payment-state__creds-box">
          <div class="payment-state__creds-row">
            <span class="payment-state__creds-key">Correo</span>
            <span class="payment-state__creds-value">{{ credentials.email }}</span>
          </div>
          <div class="payment-state__creds-row">
            <span class="payment-state__creds-key">Contraseña</span>
            <span class="payment-state__creds-value">{{ credentials.plainPassword }}</span>
          </div>
        </div>
        <p class="payment-state__creds-hint">
          Te recomendamos cambiar tu contraseña después de iniciar sesión.
        </p>
      </div>

      <div v-if="status === 'success'" class="payment-state__resend">
        <p class="payment-state__resend-label">¿No te llegó el correo?</p>
        <button type="button" class="payment-state__resend-btn" :disabled="sending" @click="resendEmail">
          <span v-if="sending">Enviando…</span>
          <span v-else>Reenviar correo</span>
        </button>
        <p v-if="resendOk" class="payment-state__resend-ok">Correo reenviado correctamente</p>
        <p v-if="resendError" class="payment-state__resend-error">{{ resendError }}</p>
      </div>

      <AuthSubmit v-if="status !== 'loading'" :loading="false" @click="credentials ? goLogin() : goHome()">
        {{ credentials ? 'Iniciar sesión' : 'Volver al inicio' }}
      </AuthSubmit>
    </div>
  </AuthLayout>
</template>

<style lang="scss" scoped>
.payment-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.payment-state__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba($lpb-green, 0.2);
  border-top-color: $lpb-green;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.payment-state__icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.5rem;

  &--success {
    background: $alert-success-bg;
    color: $alert-success;
  }

  &--error {
    background: $alert-error-bg;
    color: $alert-error;
  }
}

.payment-state__creds {
  width: 100%;
  text-align: center;
}

.payment-state__creds-label {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-muted;
  margin: 0 0 0.75rem;
}

.payment-state__creds-box {
  background: rgba($lpb-green, 0.06);
  border: 1px solid rgba($lpb-green, 0.15);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.payment-state__creds-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.payment-state__creds-key {
  font-family: $font-mono;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $lpb-muted;
}

.payment-state__creds-value {
  font-family: $font-mono;
  font-size: 0.85rem;
  font-weight: 600;
  color: $lpb-graphite;
}

.payment-state__creds-hint {
  font-family: $font-sans;
  font-size: 0.7rem;
  color: $lpb-muted;
  margin: 0.5rem 0 0;
}

.payment-state__resend {
  text-align: center;
}

.payment-state__resend-label {
  font-family: $font-sans;
  font-size: 0.8rem;
  color: $lpb-muted;
  margin: 0 0 0.5rem;
}

.payment-state__resend-btn {
  font-family: $font-sans;
  font-size: 0.85rem;
  font-weight: 600;
  color: $lpb-green-deep;
  background: none;
  border: 1px solid currentColor;
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background: $lpb-green-deep;
    color: $lpb-white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.payment-state__resend-ok {
  font-family: $font-sans;
  font-size: 0.75rem;
  color: $alert-success;
  margin: 0.5rem 0 0;
}

.payment-state__resend-error {
  font-family: $font-sans;
  font-size: 0.75rem;
  color: $alert-error;
  margin: 0.5rem 0 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
