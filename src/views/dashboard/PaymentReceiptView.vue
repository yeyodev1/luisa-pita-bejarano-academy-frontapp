<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { paymentService, type NuveiReceipt } from '@/services/paymentService'
import PaymentReceipt from '@/components/payments/PaymentReceipt.vue'

/** Comprobante de un pago con tarjeta, siempre disponible en la cuenta. */
const route = useRoute()
const receipt = ref<NuveiReceipt | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await paymentService.getReceipt(String(route.params.id))
    receipt.value = data.data
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'No pudimos cargar el comprobante.'
  }
})
</script>

<template>
  <div class="receipt-view">
    <RouterLink :to="{ name: 'payments' }" class="receipt-view__back">
      <i class="fa-solid fa-arrow-left" /> Volver a pagos
    </RouterLink>
    <p v-if="error" class="receipt-view__error">{{ error }}</p>
    <p v-else-if="!receipt" class="receipt-view__loading"><i class="fa-solid fa-spinner fa-spin" /> Cargando comprobante…</p>
    <PaymentReceipt v-else :receipt="receipt" />
  </div>
</template>

<style lang="scss" scoped>
.receipt-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
  padding-top: 16px;
  font-family: $font-sans;
}

.receipt-view__back {
  width: max-content;
  font-family: $font-mono;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-green-deep;

  i {
    margin-right: 0.35rem;
  }
}

.receipt-view__error {
  color: $alert-error;
}

.receipt-view__loading {
  color: $lpb-muted;
}
</style>
