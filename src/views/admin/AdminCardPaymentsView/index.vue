<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  adminService,
  type AdminNuveiPayment,
  type AdminNuveiSubscription,
} from '@/services/adminService'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { paymentPlanLabel } from '@/constants/paymentPlans'

/**
 * Pagos con tarjeta (Nuvei): Link to Pay y cobros de suscripción. Desde acá se
 * hacen los reembolsos (requisito bancario de Nuvei) y se gestionan las
 * suscripciones.
 */
type Tab = 'payments' | 'subscriptions'

const tab = ref<Tab>('payments')
const payments = ref<AdminNuveiPayment[]>([])
const subscriptions = ref<AdminNuveiSubscription[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const search = ref('')
const refundTarget = ref<AdminNuveiPayment | null>(null)
const cancelTarget = ref<AdminNuveiSubscription | null>(null)

const PAYMENT_STATUS: Record<AdminNuveiPayment['status'], string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  failed: 'Rechazado',
  canceled: 'Anulado',
  refunded: 'Reembolsado',
}

const SUB_STATUS: Record<AdminNuveiSubscription['status'], string> = {
  active: 'Activa',
  past_due: 'Cobro fallido',
  canceled: 'Cancelada',
}

const approvedTotal = computed(() =>
  payments.value.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
)
const activeSubs = computed(() => subscriptions.value.filter((s) => s.status !== 'canceled').length)

function who(user: AdminNuveiPayment['user']) {
  return user ? `${user.name} ${user.lastName}`.trim() : 'Usuario eliminado'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function card(brand: string | null, last4: string | null) {
  return last4 ? `${(brand || '').toUpperCase()} •••• ${last4}` : '—'
}

async function load() {
  error.value = ''
  try {
    const [p, s] = await Promise.all([
      adminService.listNuveiPayments({ search: search.value.trim() || undefined }),
      adminService.listNuveiSubscriptions(),
    ])
    payments.value = p.data.data.payments
    subscriptions.value = s.data.data.subscriptions
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'Error al cargar los pagos con tarjeta'
  } finally {
    loading.value = false
  }
}

async function run(action: () => Promise<string>) {
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    success.value = await action()
    await load()
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'No se pudo completar la acción'
  } finally {
    busy.value = false
  }
}

function refund() {
  const target = refundTarget.value
  refundTarget.value = null
  if (!target) return
  run(async () => {
    const { data } = await adminService.refundNuveiPayment(target.id)
    return data.data.refundStatus === 'pending'
      ? 'Reembolso enviado. Nuvei espera la confirmación del banco.'
      : 'Reembolso realizado y acceso retirado.'
  })
}

function cancelSubscription() {
  const target = cancelTarget.value
  cancelTarget.value = null
  if (!target) return
  run(async () => {
    await adminService.cancelNuveiSubscription(target.id)
    return 'Suscripción cancelada. No se harán más cobros.'
  })
}

function chargeNow(sub: AdminNuveiSubscription) {
  run(async () => {
    const { data } = await adminService.chargeNuveiSubscription(sub.id)
    const result = data.data
    if (result.status === 'approved') return `Cobro aprobado (${result.transactionId}).`
    if (result.status === 'failed') throw new Error(result.message || 'La tarjeta fue rechazada')
    return result.message || `Resultado: ${result.status}`
  })
}

onMounted(load)
</script>

<template>
  <div class="card-admin">
    <header class="card-admin__top">
      <div>
        <h1 class="card-admin__title">Pagos con tarjeta</h1>
        <p class="card-admin__subtitle">
          Cobros de Nuvei (links de pago y suscripciones). Desde aquí se hacen los reembolsos.
        </p>
      </div>
      <div class="card-admin__stats">
        <span><strong>USD {{ approvedTotal.toFixed(2) }}</strong> aprobados</span>
        <span><strong>{{ activeSubs }}</strong> suscripciones vigentes</span>
      </div>
    </header>

    <div v-if="error" class="card-admin__alert card-admin__alert--error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>
    <div v-if="success" class="card-admin__alert card-admin__alert--success">
      <i class="fa-solid fa-circle-check" /> {{ success }}
    </div>

    <div class="card-admin__toolbar">
      <div class="card-admin__tabs" role="tablist">
        <button
          class="card-admin__tab"
          :class="{ 'card-admin__tab--active': tab === 'payments' }"
          role="tab"
          :aria-selected="tab === 'payments'"
          @click="tab = 'payments'"
        >
          Pagos ({{ payments.length }})
        </button>
        <button
          class="card-admin__tab"
          :class="{ 'card-admin__tab--active': tab === 'subscriptions' }"
          role="tab"
          :aria-selected="tab === 'subscriptions'"
          @click="tab = 'subscriptions'"
        >
          Suscripciones ({{ subscriptions.length }})
        </button>
      </div>
      <form v-if="tab === 'payments'" class="card-admin__search" @submit.prevent="load">
        <input v-model="search" placeholder="Correo, nombre o ID de transacción" />
        <button class="admin-payments__btn admin-payments__btn--ghost" type="submit">Buscar</button>
      </form>
    </div>

    <p v-if="loading" class="card-admin__empty"><i class="fa-solid fa-spinner fa-spin" /> Cargando…</p>

    <section v-else-if="tab === 'payments'" class="card-admin__card">
      <p v-if="!payments.length" class="card-admin__empty">Aún no hay pagos con tarjeta.</p>
      <div v-else class="card-admin__wrap">
        <table class="card-admin__table">
          <thead>
            <tr>
              <th>Alumna</th>
              <th>Plan</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Tarjeta</th>
              <th>Transacción / Autorización</th>
              <th>Fecha</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id">
              <td>
                <strong>{{ who(p.user) }}</strong>
                <small>{{ p.user?.email }}</small>
              </td>
              <td>
                {{ paymentPlanLabel(p.plan) }}
                <small>{{ p.source === 'subscription' ? 'Suscripción' : 'Link de pago' }}</small>
              </td>
              <td>USD {{ p.amount }}</td>
              <td>
                <span class="card-admin__badge" :class="`card-admin__badge--${p.status}`">
                  {{ PAYMENT_STATUS[p.status] }}
                </span>
              </td>
              <td>{{ card(p.cardBrand, p.cardLast4) }}</td>
              <td>
                <code>{{ p.transactionId || '—' }}</code>
                <small>Aut. {{ p.authorizationCode || '—' }}</small>
              </td>
              <td>{{ formatDate(p.createdAt) }}</td>
              <td>
                <button
                  v-if="p.status === 'approved'"
                  class="admin-payments__btn admin-payments__btn--ghost"
                  :disabled="busy"
                  @click="refundTarget = p"
                >
                  Reembolsar
                </button>
                <small v-else-if="p.refundedAt">{{ formatDate(p.refundedAt) }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="card-admin__card">
      <p v-if="!subscriptions.length" class="card-admin__empty">Aún no hay suscripciones.</p>
      <div v-else class="card-admin__wrap">
        <table class="card-admin__table">
          <thead>
            <tr>
              <th>Alumna</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Tarjeta</th>
              <th>Próximo cobro</th>
              <th>Último cobro</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in subscriptions" :key="s.id">
              <td>
                <strong>{{ who(s.user) }}</strong>
                <small>{{ s.user?.email }}</small>
              </td>
              <td>{{ paymentPlanLabel(s.plan) }} · USD {{ s.amount }}</td>
              <td>
                <span class="card-admin__badge" :class="`card-admin__badge--${s.status}`">{{ SUB_STATUS[s.status] }}</span>
                <small v-if="s.lastError">{{ s.lastError }} ({{ s.failedAttempts }} intento/s)</small>
              </td>
              <td>{{ card(s.cardBrand, s.cardLast4) }}</td>
              <td>{{ s.status === 'canceled' ? '—' : formatDate(s.nextChargeAt) }}</td>
              <td>{{ formatDate(s.lastChargeAt) }}</td>
              <td class="card-admin__actions">
                <template v-if="s.status !== 'canceled'">
                  <button class="admin-payments__btn admin-payments__btn--ghost" :disabled="busy" @click="chargeNow(s)">
                    Cobrar ahora
                  </button>
                  <button class="admin-payments__btn admin-payments__btn--ghost" :disabled="busy" @click="cancelTarget = s">
                    Cancelar
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmModal
      :open="!!refundTarget"
      title="Reembolsar pago"
      :message="`Se devolverán USD ${refundTarget?.amount} a la tarjeta de ${who(refundTarget?.user ?? null)} y se le quitará el acceso de ese pago. Si era de una suscripción, también se cancela.`"
      action-label="Reembolsar"
      confirm-text="reembolsar"
      danger
      @confirm="refund"
      @cancel="refundTarget = null"
    />

    <ConfirmModal
      :open="!!cancelTarget"
      title="Cancelar suscripción"
      :message="`No se harán más cobros a ${who(cancelTarget?.user ?? null)}. Conserva el acceso que ya pagó.`"
      action-label="Cancelar suscripción"
      confirm-text="cancelar"
      danger
      @confirm="cancelSubscription"
      @cancel="cancelTarget = null"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/admin-shared.scss';

.card-admin {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1400px;
}

.card-admin__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-admin__title {
  font-family: $font-display;
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.card-admin__subtitle {
  font-family: $font-sans;
  color: $lpb-graphite;
  margin: 0.25rem 0 0;
}

.card-admin__stats {
  display: flex;
  gap: 1.25rem;
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;

  strong {
    color: $lpb-black;
  }
}

.card-admin__alert {
  font-family: $font-sans;
  font-size: 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;

  &--error {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
  }

  &--success {
    background: rgba($lpb-green, 0.1);
    color: $lpb-green-deep;
  }
}

.card-admin__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.card-admin__tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: $lpb-cream;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.card-admin__tab {
  font-family: $font-mono;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-graphite;
  padding: 0.6rem 1rem;
  border-radius: 999px;

  &--active {
    background: $lpb-black;
    color: $lpb-white;
  }
}

.card-admin__search {
  display: flex;
  gap: 0.5rem;

  input {
    min-width: 260px;
    font-family: $font-sans;
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: $lpb-white;
  }
}

.card-admin__card {
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  overflow: hidden;
}

.card-admin__wrap {
  overflow-x: auto;
}

.card-admin__empty {
  font-family: $font-sans;
  color: $lpb-muted;
  padding: 2rem;
  text-align: center;
  margin: 0;
}

.card-admin__table {
  width: 100%;
  border-collapse: collapse;
  font-family: $font-sans;
  font-size: 0.88rem;

  th,
  td {
    padding: 0.9rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  th {
    font-family: $font-mono;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: $lpb-muted;
    background: $lpb-cream;
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  small {
    display: block;
    color: $lpb-muted;
    font-size: 0.78rem;
    margin-top: 0.2rem;
  }

  code {
    font-family: $font-mono;
    font-size: 0.8rem;
  }
}

.card-admin__actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.card-admin__badge {
  display: inline-block;
  font-family: $font-mono;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: $lpb-cream;
  color: $lpb-graphite;

  &--approved,
  &--active {
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
  }

  &--pending,
  &--past_due {
    background: rgba($lpb-amber, 0.15);
    color: darken($lpb-amber, 20%);
  }

  &--failed {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
  }
}
</style>
