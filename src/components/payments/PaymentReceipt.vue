<script setup lang="ts">
import { computed } from 'vue'
import type { NuveiReceipt } from '@/services/paymentService'

/**
 * Comprobante de pago con tarjeta (Nuvei). Se muestra en la web para que la
 * alumna lo tenga siempre, aunque el correo no llegue. Imprimible / PDF.
 */
const props = defineProps<{ receipt: NuveiReceipt }>()

const BRANDS: Record<string, string> = {
  vi: 'Visa',
  mc: 'Mastercard',
  ax: 'American Express',
  di: 'Diners',
  dc: 'Diners',
  dn: 'Discover',
}

const card = computed(() => {
  const r = props.receipt
  if (!r.cardLast4) return '—'
  const brand = (r.cardBrand && BRANDS[r.cardBrand]) || r.cardBrand?.toUpperCase() || 'Tarjeta'
  return `${brand} •••• ${r.cardLast4}`
})

function money(n: number) {
  return `USD ${n.toFixed(2)}`
}

function dateTime(iso: string) {
  return new Date(iso).toLocaleString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Imprime solo el comprobante (el resto de la página se oculta al imprimir). */
function print() {
  const root = document.documentElement
  root.classList.add('print-receipt')
  window.addEventListener('afterprint', () => root.classList.remove('print-receipt'), { once: true })
  window.print()
}
</script>

<template>
  <article class="receipt" aria-label="Comprobante de pago">
    <header class="receipt__head">
      <div>
        <span class="receipt__eyebrow">Comprobante de pago</span>
        <h2 class="receipt__merchant">{{ receipt.merchant }}</h2>
      </div>
      <span class="receipt__status" :class="`receipt__status--${receipt.status}`">
        <i :class="receipt.status === 'refunded' ? 'fa-solid fa-rotate-left' : 'fa-solid fa-circle-check'" />
        {{ receipt.status === 'refunded' ? 'Reembolsado' : 'Pagado' }}
      </span>
    </header>

    <dl class="receipt__rows">
      <div><dt>Producto</dt><dd>{{ receipt.description }}</dd></div>
      <div><dt>Subtotal</dt><dd>{{ money(receipt.subtotal) }}</dd></div>
      <div><dt>IVA 15%</dt><dd>{{ money(receipt.vat) }}</dd></div>
      <div class="receipt__total"><dt>Total pagado</dt><dd>{{ money(receipt.amount) }}</dd></div>
      <div><dt>Fecha</dt><dd>{{ dateTime(receipt.paidAt) }}</dd></div>
      <div><dt>Tarjeta</dt><dd>{{ card }}</dd></div>
      <div><dt>ID de transacción</dt><dd><code>{{ receipt.transactionId || '—' }}</code></dd></div>
      <div><dt>Número de autorización</dt><dd><code>{{ receipt.authorizationCode || '—' }}</code></dd></div>
      <div v-if="receipt.customer"><dt>Cliente</dt><dd>{{ receipt.customer.name }}<small>{{ receipt.customer.email }}</small></dd></div>
      <div v-if="receipt.status === 'refunded' && receipt.refundedAt">
        <dt>Reembolso</dt>
        <dd>{{ money(receipt.refundedAmount ?? receipt.amount) }} · {{ dateTime(receipt.refundedAt) }}</dd>
      </div>
    </dl>

    <footer class="receipt__foot">
      <p>Pago procesado por Nuvei. Guarda este comprobante.</p>
      <button type="button" class="receipt__print" @click="print">
        <i class="fa-solid fa-print" /> Imprimir o guardar PDF
      </button>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.receipt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem 1.35rem;
  font-family: $font-sans;
}

.receipt__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.receipt__eyebrow {
  font-family: $font-mono;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green-deep;
}

.receipt__merchant {
  margin: 0.2rem 0 0;
  font-family: $font-display;
  font-size: 1.2rem;
  font-weight: 400;
  color: $lpb-black;
}

.receipt__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba($lpb-green, 0.12);
  color: $lpb-green-deep;

  &--refunded {
    background: rgba($lpb-amber, 0.14);
    color: darken($lpb-amber, 20%);
  }
}

.receipt__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--border);

  div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.88rem;
  }

  dt {
    color: $lpb-muted;
  }

  dd {
    margin: 0;
    text-align: right;
    color: $lpb-black;
  }

  small {
    display: block;
    color: $lpb-muted;
    font-size: 0.78rem;
  }

  code {
    font-family: $font-mono;
    font-size: 0.82rem;
  }
}

.receipt__total {
  font-weight: 700;

  dd {
    font-size: 1rem;
  }
}

.receipt__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;

  p {
    margin: 0;
    font-size: 0.78rem;
    color: $lpb-muted;
  }
}

.receipt__print {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: $lpb-white;
  color: $lpb-graphite;

  &:hover {
    background: $lpb-cream;
  }
}

@media print {
  .receipt__print {
    display: none;
  }
}
</style>

<style lang="scss">
@media print {
  html.print-receipt body * {
    visibility: hidden;
  }

  html.print-receipt .receipt,
  html.print-receipt .receipt * {
    visibility: visible;
  }

  html.print-receipt .receipt {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border: 0;
  }
}
</style>
