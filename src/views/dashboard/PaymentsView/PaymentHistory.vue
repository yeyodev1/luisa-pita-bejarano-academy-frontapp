<script setup lang="ts">
import { paymentPlanLabel, type PaymentPlan } from '@/constants/paymentPlans'

export interface PaymentItem {
  id: string
  plan: PaymentPlan
  amount: number
  status: string
  createdAt: string
}

defineProps<{
  loading: boolean
  items: PaymentItem[]
}>()

function statusLabel(status: string) {
  switch (status) {
    case 'approved': return 'Aprobado'
    case 'pending': return 'Pendiente'
    case 'failed': return 'Fallido'
    case 'canceled': return 'Cancelado'
    default: return status
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <section class="history">
    <h3 class="history__title">Historial de pagos</h3>
    <div class="history__wrap">
      <table class="history__table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="history__empty">Cargando historial…</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="4" class="history__empty">Aún no tienes pagos registrados</td>
          </tr>
          <tr v-for="item in items" :key="item.id">
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>{{ paymentPlanLabel(item.plan) }}</td>
            <td>USD {{ item.amount }}</td>
            <td>
              <span class="history__badge" :class="`history__badge--${item.status}`">
                {{ statusLabel(item.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history__title {
  font-family: $font-display;
  font-size: 1.25rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.history__wrap {
  overflow-x: auto;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  font-family: $font-sans;
  font-size: 0.9rem;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    font-family: $font-mono;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $lpb-muted;
    background: $lpb-cream;
  }

  tr:last-child td { border-bottom: none; }
}

.history__empty {
  text-align: center;
  color: $lpb-muted;
  padding: 2rem;
}

.history__badge {
  display: inline-block;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--approved { background: rgba($lpb-green, 0.12); color: $lpb-green-deep; }
  &--pending { background: rgba($lpb-amber, 0.12); color: $lpb-amber; }
  &--failed,
  &--canceled { background: rgba($alert-error, 0.1); color: $alert-error; }
}
</style>
