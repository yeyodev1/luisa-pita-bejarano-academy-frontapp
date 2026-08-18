<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { paymentService } from '@/services/paymentService'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import PaymentAlerts from './PaymentAlerts.vue'
import PaymentHero from './PaymentHero.vue'
import PendingBanner from './PendingBanner.vue'
import PaymentPlanCards from './PaymentPlanCards.vue'
import CancelSection from './CancelSection.vue'
import PaymentHistory from './PaymentHistory.vue'
import TransferInfoModal from './TransferInfoModal.vue'
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
    if (await paymentService.nuveiEnabled()) {
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

async function cancelSubscription() {
  cancelLoading.value = true
  error.value = ''
  success.value = ''
  try {
    await paymentService.cancelSubscription()
    userStore.setUser({ subscriptionStatus: 'canceled' })
    success.value = 'Suscripción cancelada. Seguirás con acceso hasta el final del período pagado.'
    showCancelSubModal.value = false
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

onMounted(loadHistory)
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

    <PaymentPlanCards
      v-if="!isActive"
      :loading="loading"
      @pay="initiatePayment"
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
