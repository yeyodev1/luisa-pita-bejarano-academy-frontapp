<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  paymentService,
  type NuveiChargeResult,
  type NuveiSavedCard,
  type NuveiSubscription,
} from '@/services/paymentService'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import PaymentAlerts from './PaymentAlerts.vue'
import PaymentHero from './PaymentHero.vue'
import PendingBanner from './PendingBanner.vue'
import PaymentPlanCards from './PaymentPlanCards.vue'
import CancelSection from './CancelSection.vue'
import PaymentHistory from './PaymentHistory.vue'
import TransferInfoModal from './TransferInfoModal.vue'
import SubscriptionSection from './SubscriptionSection.vue'
import MonthlySubscriptionCard from './MonthlySubscriptionCard.vue'
import CardsSection from './CardsSection.vue'
import AddCardModal from './AddCardModal.vue'
import PaymentChangeNotice from './PaymentChangeNotice.vue'
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

/**
 * Con Nuvei activo el único producto es la suscripción mensual con tarjeta
 * guardada. Si no, se mantiene el flujo anterior (PayPhone / transferencia).
 */
const nuvei = ref({ enabled: false, subscriptionsEnabled: false })
const useCards = computed(() => nuvei.value.subscriptionsEnabled)
const monthlyAmount = ref(47)
const subscription = ref<NuveiSubscription | null>(null)
const cards = ref<NuveiSavedCard[]>([])
const cardsLoading = ref(false)
const busyCard = ref<string | null>(null)
const subscribing = ref(false)
const addCard = ref<{ open: boolean; thenSubscribe: boolean }>({ open: false, thenSubscribe: false })
const showConfirmSubscribe = ref(false)
const removeTarget = ref<NuveiSavedCard | null>(null)

/** Suscripción que todavía cobra (activa o con un cobro fallido en reintento). */
const liveSubscription = computed(() =>
  subscription.value && subscription.value.status !== 'canceled' ? subscription.value : null,
)
const defaultCard = computed(() => cards.value.find((c) => c.isDefault && c.status === 'valid') ?? null)

/** Acceso sin vencimiento (p. ej. fundadoras): no necesitan suscripción. */
const hasLifetimeAccess = computed(
  () => userStore.foundingMember || (userStore.subscriptionStatus === 'active' && !userStore.accessUntil),
)

/**
 * Cambio de forma de pago: quien ya tiene acceso pagado registra su tarjeta
 * sin cobro hoy; el primer cobro es el día que vence ese acceso.
 */
const paidUntilLabel = computed(() => {
  if (!userStore.accessUntil) return null
  const until = new Date(userStore.accessUntil)
  if (until <= new Date()) return null
  return until.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
})

const confirmSubscribeMessage = computed(() =>
  paidUntilLabel.value
    ? `Hoy NO se te cobrará nada. Registraremos tu tarjeta •••• ${defaultCard.value?.last4} y el primer cobro de USD ${monthlyAmount.value} será el ${paidUntilLabel.value}; luego cada mes. Puedes cancelar la renovación cuando quieras.`
    : `Cobraremos USD ${monthlyAmount.value} hoy a tu tarjeta •••• ${defaultCard.value?.last4} y luego cada mes. Puedes cancelar la renovación cuando quieras.`,
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
  if (liveSubscription.value) return 'Suscripción mensual'
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

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string }).message || fallback
}

async function loadHistory() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await paymentService.history()
    history.value = data.data.history
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Error al cargar historial')
  } finally {
    loading.value = false
  }
}

/** Flujo anterior (Nuvei apagado): pago único con PayPhone. */
async function initiatePayment(plan: PaymentPlan) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await paymentService.preparePlan({
      email: userStore.email || '',
      name: userStore.name || '',
      lastName: userStore.lastName || '',
      plan,
    })

    const payUrl = data.data.payWithCard
    if (payUrl) {
      window.location.href = payUrl
    } else {
      error.value = 'No se pudo iniciar el pago. Intenta de nuevo.'
    }
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Error al preparar el pago')
  } finally {
    loading.value = false
  }
}

// ── Suscripción mensual con tarjeta (Nuvei) ──────────────────────────────────

async function loadNuvei() {
  nuvei.value = await paymentService.nuveiHealth()
  if (!nuvei.value.subscriptionsEnabled) return
  cardsLoading.value = true
  try {
    const [config, cardList] = await Promise.all([
      paymentService.subscriptionConfig(),
      paymentService.listCards(),
    ])
    monthlyAmount.value = config.data.data.amount
    subscription.value = config.data.data.subscription
    cards.value = cardList.data.data.cards
  } catch (err: unknown) {
    error.value = errorMessage(err, 'No se pudieron cargar tus tarjetas')
  } finally {
    cardsLoading.value = false
  }
}

/** Mensaje para el resultado de un cobro (alta o cambio de tarjeta en mora). */
function reportCharge(charge: NuveiChargeResult | null, fallback: string) {
  if (!charge) {
    success.value = fallback
  } else if (charge.status === 'approved') {
    success.value = '¡Listo! Tu pago fue aprobado y tu acceso está activo. Te enviamos el comprobante por correo.'
  } else if (charge.status === 'pending') {
    success.value = charge.message || 'Tu pago quedó pendiente de confirmación del banco.'
  } else if (charge.status === 'failed') {
    error.value = charge.message || 'La tarjeta fue rechazada. Prueba con otra tarjeta.'
  } else {
    success.value = charge.message || fallback
  }
}

async function refreshAfterCharge() {
  await Promise.all([userStore.validateSession(), loadHistory(), loadNuvei()])
}

function startSubscribe() {
  error.value = ''
  success.value = ''
  if (defaultCard.value) showConfirmSubscribe.value = true
  else addCard.value = { open: true, thenSubscribe: true }
}

async function subscribe(cardToken?: string) {
  showConfirmSubscribe.value = false
  subscribing.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await paymentService.subscribe(cardToken)
    subscription.value = data.data.subscription
    if (data.data.firstChargeAt) {
      const first = new Date(data.data.firstChargeAt).toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      success.value = `¡Listo! Tu tarjeta quedó registrada y hoy no se te cobró nada. Tu primer cobro será el ${first}. Te enviamos la confirmación por correo.`
    } else {
      reportCharge(data.data.charge, 'Suscripción creada.')
    }
    await refreshAfterCharge()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'No se pudo activar la suscripción')
  } finally {
    subscribing.value = false
  }
}

async function onCardSaved(payload: { cards: NuveiSavedCard[]; charge: NuveiChargeResult | null; token: string }) {
  const thenSubscribe = addCard.value.thenSubscribe
  addCard.value = { open: false, thenSubscribe: false }
  cards.value = payload.cards
  if (thenSubscribe) {
    await subscribe(payload.token)
    return
  }
  reportCharge(payload.charge, 'Tarjeta guardada.')
  if (payload.charge) await refreshAfterCharge()
}

async function makeDefault(card: NuveiSavedCard) {
  busyCard.value = card.token
  error.value = ''
  success.value = ''
  try {
    const { data } = await paymentService.setDefaultCard(card.token)
    cards.value = data.data.cards
    subscription.value = data.data.subscription
    reportCharge(data.data.charge, 'Tarjeta principal actualizada. Los próximos cobros se harán a esta tarjeta.')
    if (data.data.charge) await refreshAfterCharge()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'No se pudo cambiar la tarjeta principal')
  } finally {
    busyCard.value = null
  }
}

async function removeCard() {
  const card = removeTarget.value
  removeTarget.value = null
  if (!card) return
  busyCard.value = card.token
  error.value = ''
  success.value = ''
  try {
    const { data } = await paymentService.removeCard(card.token)
    cards.value = data.data.cards
    success.value = 'Tarjeta eliminada.'
  } catch (err: unknown) {
    error.value = errorMessage(err, 'No se pudo eliminar la tarjeta')
  } finally {
    busyCard.value = null
  }
}

function scrollToCards() {
  document.querySelector('.cards-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function cancelSubscription() {
  cancelLoading.value = true
  error.value = ''
  success.value = ''
  try {
    await paymentService.cancelSubscription()
    userStore.setUser({ subscriptionStatus: 'canceled' })
    success.value = 'Renovación cancelada. No se harán más cobros y conservas tu acceso hasta el final del mes pagado.'
    showCancelSubModal.value = false
    await loadNuvei()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Error al cancelar la suscripción')
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
    error.value = errorMessage(err, 'Error al cancelar pagos pendientes')
  } finally {
    cancelPendingLoading.value = false
  }
}

function goToPaymentPage() {
  const el = document.querySelector(useCards.value ? '.monthly' : '.plans')
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
  loadNuvei()
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

    <template v-if="useCards">
      <PaymentChangeNotice
        v-if="!liveSubscription && !hasLifetimeAccess"
        :amount="monthlyAmount"
        :paid-until-label="paidUntilLabel"
      />

      <SubscriptionSection
        v-if="liveSubscription"
        :subscription="liveSubscription"
        @update-card="scrollToCards"
        @cancel="showCancelSubModal = true"
      />

      <MonthlySubscriptionCard
        v-else-if="!hasLifetimeAccess"
        :amount="monthlyAmount"
        :default-card="defaultCard"
        :loading="subscribing"
        :first-charge-label="paidUntilLabel"
        @subscribe="startSubscribe"
      />

      <CardsSection
        :cards="cards"
        :loading="cardsLoading"
        :busy-token="busyCard"
        @add="addCard = { open: true, thenSubscribe: false }"
        @make-default="makeDefault"
        @remove="removeTarget = $event"
      />
    </template>

    <template v-else>
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
    </template>

    <PaymentHistory :loading="loading" :items="visibleHistory" />

    <ConfirmModal
      :open="showCancelSubModal"
      title="Cancelar renovación"
      message="¿Estás segura de cancelar la renovación? No se harán más cobros a tu tarjeta y no se realizan reembolsos. Seguirás con acceso hasta el final del mes pagado."
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

    <AddCardModal
      :open="addCard.open"
      :make-default="addCard.thenSubscribe || !cards.length"
      :submit-label="
        addCard.thenSubscribe
          ? paidUntilLabel
            ? 'Guardar tarjeta (sin cobro hoy)'
            : `Guardar y pagar USD ${monthlyAmount}`
          : undefined
      "
      @close="addCard = { open: false, thenSubscribe: false }"
      @saved="onCardSaved"
    />

    <ConfirmModal
      :open="showConfirmSubscribe"
      title="Confirmar suscripción"
      :message="confirmSubscribeMessage"
      :action-label="paidUntilLabel ? 'Activar sin cobro hoy' : `Pagar USD ${monthlyAmount}`"
      :loading="subscribing"
      @confirm="subscribe()"
      @cancel="showConfirmSubscribe = false"
    />

    <ConfirmModal
      :open="!!removeTarget"
      title="Eliminar tarjeta"
      :message="`¿Eliminar la tarjeta •••• ${removeTarget?.last4}? Podrás agregarla de nuevo cuando quieras.`"
      action-label="Eliminar"
      danger
      @confirm="removeCard"
      @cancel="removeTarget = null"
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
