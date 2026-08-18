<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentService, type NuveiStatusResponse } from '@/services/paymentService'

const route = useRoute()
const router = useRouter()

const result = ref<NuveiStatusResponse | null>(null)
const loading = ref(true)
const error = ref('')

const devReference = computed(() => String(route.query.ref ?? ''))

/**
 * El webhook de Nuvei es la fuente de verdad y puede llegar unos segundos
 * después del redirect, así que reintentamos mientras siga en pending.
 */
const MAX_ATTEMPTS = 10
let timer: ReturnType<typeof setTimeout> | undefined
let attempts = 0

async function poll() {
  try {
    const { data } = await paymentService.nuveiStatus(devReference.value)
    result.value = data.data
    if (data.data.status === 'pending' && attempts < MAX_ATTEMPTS) {
      attempts += 1
      timer = setTimeout(poll, 3000)
      return
    }
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'No pudimos confirmar tu pago.'
  }
  loading.value = false
}

onMounted(() => {
  if (!devReference.value) {
    error.value = 'Falta la referencia del pago.'
    loading.value = false
    return
  }
  poll()
})

onBeforeUnmount(() => clearTimeout(timer))

const isApproved = computed(() => result.value?.status === 'approved')
const isPending = computed(() => result.value?.status === 'pending')

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

function goToPayments() {
  router.push({ name: 'payments' })
}
</script>

<template>
  <main class="nrv">
    <section class="nrv__card">
      <div v-if="loading" class="nrv__state">
        <i class="fa-solid fa-spinner fa-spin nrv__spinner" />
        <h1 class="nrv__title">Confirmando tu pago…</h1>
        <p class="nrv__text">Estamos verificando la transacción con Nuvei. No cierres esta ventana.</p>
      </div>

      <div v-else-if="error" class="nrv__state">
        <div class="nrv__icon nrv__icon--error"><i class="fa-solid fa-circle-exclamation" /></div>
        <h1 class="nrv__title">No pudimos confirmar tu pago</h1>
        <p class="nrv__text">{{ error }}</p>
        <button class="nrv__btn" type="button" @click="goToPayments">Volver a pagos</button>
      </div>

      <div v-else-if="isApproved" class="nrv__state">
        <div class="nrv__icon nrv__icon--success"><i class="fa-solid fa-circle-check" /></div>
        <h1 class="nrv__title">¡Pago confirmado!</h1>
        <p class="nrv__text">
          Tu acceso ya está activo. Te enviamos un correo a
          <strong>{{ result?.email }}</strong> con los detalles.
        </p>
        <div v-if="result?.plainPassword" class="nrv__credentials">
          <p class="nrv__credentials-label">Tu contraseña temporal</p>
          <code class="nrv__password">{{ result.plainPassword }}</code>
          <p class="nrv__credentials-hint">Cámbiala desde Configuración apenas ingreses.</p>
        </div>
        <button class="nrv__btn" type="button" @click="goToDashboard">Entrar a la academia</button>
      </div>

      <div v-else-if="isPending" class="nrv__state">
        <div class="nrv__icon nrv__icon--pending"><i class="fa-solid fa-clock" /></div>
        <h1 class="nrv__title">Tu pago está en proceso</h1>
        <p class="nrv__text">
          El banco aún no confirma la transacción. Apenas se acredite te llegará un correo y tu
          acceso se activará automáticamente.
        </p>
        <button class="nrv__btn" type="button" @click="goToPayments">Ver mis pagos</button>
      </div>

      <div v-else class="nrv__state">
        <div class="nrv__icon nrv__icon--error"><i class="fa-solid fa-circle-xmark" /></div>
        <h1 class="nrv__title">El pago no se completó</h1>
        <p class="nrv__text">No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras.</p>
        <button class="nrv__btn" type="button" @click="goToPayments">Intentar de nuevo</button>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.nrv {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 1.5rem;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
}

.nrv__card {
  width: 100%;
  max-width: 460px;
  padding: 2.5rem 2rem;
  background: $lpb-paper;
  border-radius: 1.25rem;
  box-shadow: 0 24px 64px rgba($lpb-black, 0.3);
}

.nrv__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.nrv__spinner {
  font-size: 2rem;
  color: $lpb-green-deep;
}

.nrv__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 1.7rem;

  &--success {
    background: $alert-success-bg;
    color: $alert-success;
  }

  &--error {
    background: $alert-error-bg;
    color: $alert-error;
  }

  &--pending {
    background: rgba($lpb-amber, 0.15);
    color: darken($lpb-amber, 15%);
  }
}

.nrv__title {
  font-family: $font-display;
  font-size: 1.5rem;
  color: $lpb-black;
  margin: 0;
}

.nrv__text {
  font-family: $font-sans;
  font-size: 0.92rem;
  color: $lpb-graphite;
  margin: 0;
  line-height: 1.5;
}

.nrv__credentials {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba($lpb-green, 0.08);
  border: 1px solid rgba($lpb-green-deep, 0.15);
}

.nrv__credentials-label {
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: $lpb-muted;
  margin: 0 0 0.4rem;
}

.nrv__password {
  font-family: $font-mono;
  font-size: 1.05rem;
  font-weight: 700;
  color: $lpb-green-deep;
  letter-spacing: 0.06em;
}

.nrv__credentials-hint {
  font-family: $font-sans;
  font-size: 0.78rem;
  color: $lpb-muted;
  margin: 0.5rem 0 0;
}

.nrv__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem 1.6rem;
  border-radius: 999px;
  background: $lpb-green-deep;
  color: $lpb-white;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: $lpb-green-dark;
  }
}
</style>
