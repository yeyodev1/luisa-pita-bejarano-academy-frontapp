<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { adminService, type AdminNuveiPayment, type AdminRefundPreview } from '@/services/adminService'

/**
 * Confirmación de reembolso total con Nuvei. Muestra a quién se devuelve, cuánto,
 * si está dentro del plazo de la política (solo informativo) y qué pasa después.
 */
const props = defineProps<{ payment: AdminNuveiPayment | null; busy: boolean }>()

const emit = defineEmits<{
  (e: 'confirm', payment: AdminNuveiPayment): void
  (e: 'cancel'): void
}>()

const preview = ref<AdminRefundPreview | null>(null)
const loadingPreview = ref(false)

const who = computed(() => {
  const u = props.payment?.user
  return u ? `${u.name} ${u.lastName}`.trim() : 'Usuario eliminado'
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(
  () => props.payment,
  async (payment) => {
    preview.value = null
    if (!payment) return
    loadingPreview.value = true
    try {
      const { data } = await adminService.refundPreview(payment.id)
      preview.value = data.data
    } catch {
      preview.value = null
    } finally {
      loadingPreview.value = false
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="payment" class="refund" role="dialog" aria-modal="true" @click.self="!busy && emit('cancel')">
      <div class="refund__panel">
        <h2 class="refund__title">Reembolsar pago</h2>

        <dl class="refund__facts">
          <div><dt>Alumna</dt><dd>{{ who }}<small>{{ payment.user?.email }}</small></dd></div>
          <div><dt>Transacción Nuvei</dt><dd><code>{{ payment.transactionId }}</code></dd></div>
          <div class="refund__amount"><dt>Se devolverá</dt><dd>USD {{ payment.amount.toFixed(2) }} <small>(total)</small></dd></div>
        </dl>

        <p v-if="loadingPreview" class="refund__policy"><i class="fa-solid fa-spinner fa-spin" /> Revisando plazo…</p>
        <p v-else-if="preview" class="refund__policy" :class="preview.withinWindow ? 'is-ok' : 'is-late'">
          <i :class="preview.withinWindow ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'" />
          <span v-if="preview.withinWindow">
            Dentro del plazo de la política (hasta el {{ formatDate(preview.deadline) }}).
          </span>
          <span v-else>
            Fuera del plazo de 2 días de la política (venció el {{ formatDate(preview.deadline) }}). Puedes reembolsar
            igual si lo decides.
          </span>
        </p>

        <ul class="refund__effects">
          <li>Nuvei devuelve el dinero a la misma tarjeta.</li>
          <li>Se cancela la suscripción: no habrá más cobros.</li>
          <li>Se retira el acceso de ese pago.</li>
          <li>La alumna recibe un correo con el monto y el ID de transacción.</li>
        </ul>

        <div class="refund__actions">
          <button type="button" class="refund__btn refund__btn--ghost" :disabled="busy" @click="emit('cancel')">
            Cancelar
          </button>
          <button type="button" class="refund__btn refund__btn--danger" :disabled="busy" @click="emit('confirm', payment)">
            <i :class="busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-left'" />
            {{ busy ? 'Reembolsando…' : `Reembolsar USD ${payment.amount.toFixed(2)}` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.refund {
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

.refund__panel {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba($lpb-black, 0.2);
  font-family: $font-sans;
}

.refund__title {
  font-family: $font-display;
  font-size: 1.4rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.refund__facts {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: $lpb-cream;

  div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  dt {
    color: $lpb-muted;
    font-size: 0.85rem;
  }

  dd {
    margin: 0;
    text-align: right;
    color: $lpb-black;
    font-size: 0.9rem;
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

.refund__amount dd {
  font-weight: 700;
  font-size: 1.05rem;

  small {
    display: inline;
    font-weight: 400;
  }
}

.refund__policy {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  line-height: 1.45;
  color: $lpb-graphite;
  background: $lpb-cream;

  &.is-ok {
    background: rgba($lpb-green, 0.1);
    color: $lpb-green-deep;
  }

  &.is-late {
    background: rgba($lpb-amber, 0.12);
    color: darken($lpb-amber, 22%);
  }
}

.refund__effects {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  line-height: 1.55;
  color: $lpb-graphite;
}

.refund__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.refund__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;

  &--ghost {
    color: $lpb-graphite;
    border: 1px solid var(--border);
    background: $lpb-white;
  }

  &--danger {
    color: $lpb-white;
    background: $alert-error;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}
</style>
