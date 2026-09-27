<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { paymentService } from '@/services/paymentService'
import { readCheckoutDone } from '@/utils/checkoutDone'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'

/**
 * Final del checkout sin login: confirma la suscripción, dice a qué correo
 * llegó el acceso y permite reenviarlo (con aviso de revisar spam).
 */
const route = useRoute()
const done = readCheckoutDone()

const email = computed(() => done?.email || String(route.query.email ?? ''))
const firstChargeLabel = computed(() =>
  done?.status === 'scheduled' && done.firstChargeAt
    ? new Date(done.firstChargeAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
    : null,
)
const isPending = computed(() => done?.status === 'pending')

const cooldown = ref(0)
const resending = ref(false)
const resendNote = ref('')
let timer: ReturnType<typeof setInterval> | undefined

function startCooldown(seconds: number) {
  cooldown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function resend() {
  if (!email.value || cooldown.value > 0) return
  resending.value = true
  resendNote.value = ''
  try {
    const { data } = await paymentService.resendAccessEmail(email.value)
    resendNote.value = 'Listo, te lo reenviamos. Puede tardar unos minutos en llegar.'
    startCooldown(data.data.cooldownSeconds || 60)
  } catch (err: unknown) {
    resendNote.value = (err as { message?: string }).message || 'No pudimos reenviarlo. Intenta en un momento.'
  } finally {
    resending.value = false
  }
}

// El correo recién se envió: se espera un minuto antes de permitir reenviarlo.
if (done) startCooldown(60)

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <main class="welcome">
    <section class="welcome__card">
      <RouterLink :to="{ name: 'home' }" class="welcome__brand"><BrandWordmark size="sm" /></RouterLink>

      <div class="welcome__icon"><i class="fa-solid fa-envelope-circle-check" /></div>
      <h1 class="welcome__title">{{ isPending ? '¡Casi listo!' : '¡Tu suscripción está activa!' }}</h1>

      <p class="welcome__text">
        Te enviamos tu acceso a
        <strong>{{ email || 'tu correo' }}</strong>.
        Abre el correo de <strong>Luisa Pita Bejarano Academy</strong> y sigue el botón para entrar.
      </p>

      <p v-if="isPending" class="welcome__info">
        Tu banco dejó el pago pendiente de confirmación. Apenas se confirme se activa tu acceso y te avisamos por correo.
      </p>
      <p v-else-if="firstChargeLabel" class="welcome__info">
        <strong>Hoy no se te cobró nada.</strong> Tu acceso actual sigue vigente y el primer cobro será el
        <strong>{{ firstChargeLabel }}</strong>.
      </p>
      <p v-else class="welcome__info">
        También te enviamos el comprobante de pago. Tu suscripción se renueva cada mes y puedes cancelarla cuando quieras.
      </p>

      <div class="welcome__spam">
        <h2><i class="fa-solid fa-triangle-exclamation" /> ¿No ves el correo?</h2>
        <ul>
          <li>Espera 2 o 3 minutos: a veces tarda un poco.</li>
          <li>Revisa las carpetas <strong>Spam</strong>, <strong>Correo no deseado</strong> o <strong>Promociones</strong>.</li>
          <li>Busca “Luisa Pita Bejarano” en tu bandeja.</li>
          <li>Si está en spam, márcalo como <strong>“No es spam”</strong> para recibir los próximos avisos.</li>
        </ul>
      </div>

      <button class="welcome__btn" type="button" :disabled="resending || cooldown > 0 || !email" @click="resend">
        <i :class="resending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'" />
        {{ cooldown > 0 ? `Reenviar correo (${cooldown}s)` : 'Reenviar correo' }}
      </button>
      <p v-if="resendNote" class="welcome__note">{{ resendNote }}</p>

      <RouterLink :to="{ name: 'login' }" class="welcome__link">Ya creé mi contraseña · Iniciar sesión</RouterLink>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.welcome {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: $lpb-paper;
}

.welcome__card {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
  background: $lpb-white;
  border: 1px solid rgba($lpb-black, 0.06);
  border-radius: 1.5rem;
  padding: clamp(2rem, 6vw, 3rem);
  box-shadow: 0 24px 80px rgba($lpb-black, 0.06);
}

.welcome__brand {
  align-self: center;
  color: $lpb-black;
}

.welcome__icon {
  align-self: center;
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  background: rgba($lpb-green, 0.14);
  color: $lpb-green-deep;
  font-size: 1.8rem;
}

.welcome__title {
  font-family: $font-display;
  font-size: clamp(1.6rem, 5vw, 2.1rem);
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.welcome__text,
.welcome__info,
.welcome__note {
  font-family: $font-sans;
  font-size: 0.98rem;
  line-height: 1.55;
  color: $lpb-graphite;
  margin: 0;

  strong {
    color: $lpb-black;
  }
}

.welcome__info {
  font-size: 0.9rem;
  background: $lpb-cream;
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
}

.welcome__note {
  font-size: 0.85rem;
  color: $lpb-green-deep;
}

.welcome__spam {
  text-align: left;
  border: 1px solid rgba($lpb-amber, 0.45);
  background: rgba($lpb-amber, 0.08);
  border-radius: 0.85rem;
  padding: 1rem 1.1rem;
  font-family: $font-sans;

  h2 {
    font-family: $font-sans;
    font-size: 0.95rem;
    font-weight: 700;
    color: $lpb-black;
    margin: 0 0 0.5rem;

    i {
      color: darken($lpb-amber, 15%);
      margin-right: 0.35rem;
    }
  }

  ul {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.88rem;
    color: $lpb-graphite;
  }
}

.welcome__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: $font-mono;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 1rem 1.25rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;

  &:hover:not(:disabled) {
    background: $lpb-green-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.welcome__link {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  text-decoration: underline;
}
</style>
