<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { paymentService, type NuveiChargeResult, type NuveiSubscription } from '@/services/paymentService'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import PaymentAlerts from './PaymentAlerts.vue'
import PaymentHero from './PaymentHero.vue'
import PendingBanner from './PendingBanner.vue'
import PaymentPlanCards from './PaymentPlanCards.vue'
import CancelSection from './CancelSection.vue'
import PaymentHistory from './PaymentHistory.vue'
import TransferInfoModal from './TransferInfoModal.vue'
import SubscriptionSection from './SubscriptionSection.vue'
import CardSubscriptionModal from './CardSubscriptionModal.vue'
import type { PaymentItem } from './PaymentHistory.vue'
import { paymentPlanLabel, type PaymentPlan } from '@/constants/paymentPlans'

const userStore = useUserStore()

const loading = ref(false)
const cancelLoading = ref(false)
const cancelPendingLoading = ref(false)
const error = ref('')
const success = ref('')
const showCancelSubModal = ref(false)
const showCancelPendingModal = ref(false)
const showTransferModal = ref(false)

const history = ref<PaymentItem[]>([])

const nuvei = ref({ enabled: false, subscriptionsEnabled: false })
const subscription = ref<NuveiSubscription | null>(null)
const cardModal = ref<{ open: boolean; plan: PaymentPlan | null; mode: 'subscribe' | 'update-card' }>({
  open: false,
  plan: null,
  mode: 'subscribe',
})

/** Suscripción que todavía cobra (activa o con un cobro fallido en reintento). */
const liveSubscription = computed(() =>
  subscription.value && subscription.value.status !== 'canceled' ? subscription.value : null,
)

const whatsappNumber = (import.meta.env.VITE_ADMIN_WHATSAPP as string) || '593992019807'

const isActive = computed(() => {
  if (!userStore.accessUntil) return false
  return new Date(userStore.accessUntil) > new Date()
})

const isCanceled = computed(() => userStore.subscriptionStatus === 'canceled')

const accessUntilDate = computed(() => {
  if (!userStore.accessUntil) return null
  return new Date(userStore.accessUntil)
})

const currentPlan = computed(() => {
  const approved = history.value
    .filter((h) => h.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return approved[0]?.plan || null
})

const planLabel = computed(() => {
  if (userStore.foundingMember) return 'Miembro Fundador'
  if (currentPlan.value) return paymentPlanLabel(currentPlan.value)
  return 'Sin plan activo'
})

const pendingPayments = computed(() =>
  history.value.filter((h) => h.status === 'pending'),
)

const visibleHistory = computed(() =>
  history.value.filter((h) => h.status !== 'pending'),
)

const whatsappLink = computed(
  () => `https://wa.me/${whatsappNumber}?text=Hola, quiero realizar el pago por transferencia bancaria para la academia de Luisa Pita Bejarano. ¿Podrían indicarme los datos bancarios para hacer el depósito?`,
)

const accessUntilLabel = computed(() => {
  if (!accessUntilDate.value) return 'Sin acceso activo'
  return accessUntilDate.value.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

async function loadHistory() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await paymentService.history()
    history.value = data.data.history
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al cargar historial'
  } finally {
    loading.value = false
  }
}

async function initiatePayment(plan: PaymentPlan) {
  loading.value = true
  error.value = ''
  try {
    const payload = {
      email: userStore.email || '',
      name: userStore.name || '',
      lastName: userStore.lastName || '',
    }

    // Nuvei es la pasarela preferida; si el comercio aún no está activado,
    // el backend responde enabled:false y seguimos con PayPhone.
    await nuveiReady
    if (nuvei.value.enabled) {
      const { data } = await paymentService.createNuveiLink({ ...payload, plan })
      const nuveiUrl = data.data.paymentUrl
      if (nuveiUrl) {
        window.location.href = nuveiUrl
        return
      }
    }

    const { data } = await paymentService.preparePlan({ ...payload, plan })

    const payUrl = data.data.payWithCard
    if (payUrl) {
      window.location.href = payUrl
    } else {
      error.value = 'No se pudo iniciar el pago. Intenta de nuevo.'
    }
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al preparar el pago'
  } finally {
    loading.value = false
  }
}

let nuveiReady: Promise<void> | null = null

async function loadNuvei() {
  nuvei.value = await paymentService.nuveiHealth()
  if (!nuvei.value.enabled) return
  try {
    const { data } = await paymentService.mySubscription()
    subscription.value = data.data.subscription
  } catch {
    subscription.value = null
  }
}

function openSubscribe(plan: PaymentPlan) {
  cardModal.value = { open: true, plan, mode: 'subscribe' }
}

function openUpdateCard() {
  cardModal.value = { open: true, plan: subscription.value?.plan ?? null, mode: 'update-card' }
}

async function onCardDone(payload: { charge: NuveiChargeResult | null; subscription: NuveiSubscription | null }) {
  const mode = cardModal.value.mode
  cardModal.value = { open: false, plan: null, mode: 'subscribe' }
  subscription.value = payload.subscription
  error.value = ''
  const charge = payload.charge
  if (charge?.status === 'approved') {
    success.value = mode === 'update-card'
      ? 'Tarjeta actualizada y pago realizado. Tu acceso está activo.'
      : '¡Listo! Tu suscripción está activa. Te enviamos el comprobante por correo.'
  } else if (charge?.status === 'pending') {
    success.value = charge.message || 'Tu pago quedó pendiente de confirmación del banco.'
  } else if (charge?.status === 'failed') {
    error.value = charge.message || 'La tarjeta fue rechazada.'
  } else {
    success.value = 'Tarjeta actualizada. Los próximos cobros se harán con esta tarjeta.'
  }
  await Promise.all([userStore.validateSession(), loadHistory()])
}

async function cancelSubscription() {
  cancelLoading.value = true
  error.value = ''
  success.value = ''
  try {
    await paymentService.cancelSubscription()
    userStore.setUser({ subscriptionStatus: 'canceled' })
    success.value = 'Suscripción cancelada. Seguirás con acceso hasta el final del período pagado.'
    showCancelSubModal.value = false
    await loadNuvei()
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al cancelar la suscripción'
  } finally {
    cancelLoading.value = false
  }
}

async function cancelPending() {
  cancelPendingLoading.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await paymentService.cancelPending()
    success.value = `${data.data.canceled} pago(s) pendiente(s) cancelado(s).`
    showCancelPendingModal.value = false
    await loadHistory()
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al cancelar pagos pendientes'
  } finally {
    cancelPendingLoading.value = false
  }
}

function goToPaymentPage() {
  const el = document.querySelector('.cards')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openTransferModal() {
  showTransferModal.value = true
}

function closeTransferModal() {
  showTransferModal.value = false
}

function goToWhatsApp() {
  window.open(whatsappLink.value, '_blank', 'noopener')
  closeTransferModal()
}

onMounted(() => {
  loadHistory()
  nuveiReady = loadNuvei()
})
</script>

<template>
  <div class="payments">
    <PaymentAlerts :error="error" :success="success" />

    <PaymentHero
      :is-active="isActive"
      :plan-label="planLabel"
      :is-founding-member="userStore.foundingMember"
      :access-until-label="accessUntilLabel"
      :access-until-date="accessUntilDate"
      @go-to-payment-page="goToPaymentPage"
    />

    <PendingBanner
      :pending-count="pendingPayments.length"
      :loading="cancelPendingLoading"
      @cancel-pending="showCancelPendingModal = true"
    />

    <SubscriptionSection
      v-if="liveSubscription"
      :subscription="liveSubscription"
      @update-card="openUpdateCard"
      @cancel="showCancelSubModal = true"
    />

    <PaymentPlanCards
      v-if="!isActive && !liveSubscription"
      :loading="loading"
      :card-enabled="nuvei.enabled"
      :subscriptions-enabled="nuvei.subscriptionsEnabled"
      @pay="initiatePayment"
      @subscribe="openSubscribe"
      @open-transfer="openTransferModal"
    />

    <CancelSection
      :is-active="isActive"
      :is-canceled="isCanceled"
      :cancel-loading="cancelLoading"
      :access-until-label="accessUntilLabel"
      @cancel-subscription="showCancelSubModal = true"
    />

    <PaymentHistory :loading="loading" :items="visibleHistory" />

    <ConfirmModal
      :open="showCancelSubModal"
      title="Cancelar suscripción"
      message="¿Estás segura de cancelar tu suscripción? No se realizan reembolsos. Seguirás con acceso hasta el final del período pagado."
      action-label="Sí, cancelar"
      confirm-text="cancelar"
      danger
      @confirm="cancelSubscription"
      @cancel="showCancelSubModal = false"
    />

    <ConfirmModal
      :open="showCancelPendingModal"
      title="Cancelar pagos pendientes"
      :message="`¿Estás segura de cancelar ${pendingPayments.length} pago(s) pendiente(s)? Esta acción no se puede deshacer.`"
      action-label="Sí, cancelar"
      confirm-text="cancelar"
      danger
      @confirm="cancelPending"
      @cancel="showCancelPendingModal = false"
    />

    <CardSubscriptionModal
      :open="cardModal.open"
      :plan="cardModal.plan"
      :mode="cardModal.mode"
      @close="cardModal.open = false"
      @done="onCardDone"
    />

    <TransferInfoModal
      :show="showTransferModal"
      @confirm="goToWhatsApp"
      @cancel="closeTransferModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.payments {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 16px;
}
</style>
