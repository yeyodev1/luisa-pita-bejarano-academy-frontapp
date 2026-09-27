<script setup lang="ts">
/**
 * Aviso del cambio de forma de pago (de pago único a suscripción mensual con
 * tarjeta). Si la alumna ya tiene acceso pagado, se deja muy claro que al
 * registrar la tarjeta no se cobra nada hoy.
 */
defineProps<{
  amount: number
  /** Fecha (ya formateada) hasta la que tiene acceso pagado; null si no tiene. */
  paidUntilLabel: string | null
}>()
</script>

<template>
  <section class="notice" role="status">
    <div class="notice__icon"><i class="fa-solid fa-bullhorn" /></div>
    <div class="notice__body">
      <h3 class="notice__title">Estamos cambiando la forma de pago</h3>
      <p class="notice__text">
        Desde ahora el acceso a la academia es con una <strong>suscripción mensual de USD {{ amount }}</strong>
        que se cobra automáticamente a tu tarjeta. Puedes cancelar la renovación cuando quieras.
      </p>

      <template v-if="paidUntilLabel">
        <ul class="notice__points">
          <li><i class="fa-solid fa-check" /> Tu acceso actual <strong>sigue vigente hasta el {{ paidUntilLabel }}</strong>.</li>
          <li><i class="fa-solid fa-check" /> Registra tu tarjeta hoy: <strong>no se te cobrará nada ahora</strong>.</li>
          <li><i class="fa-solid fa-check" /> Tu primer cobro de USD {{ amount }} será el <strong>{{ paidUntilLabel }}</strong> y luego cada mes.</li>
        </ul>
        <p class="notice__cta">Actualízala antes del {{ paidUntilLabel }} para no perder el acceso.</p>
      </template>
      <p v-else class="notice__cta">Agrega tu tarjeta para activar tu acceso hoy.</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.notice {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba($lpb-amber, 0.45);
  background: rgba($lpb-amber, 0.08);
}

.notice__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: rgba($lpb-amber, 0.2);
  color: darken($lpb-amber, 20%);
}

.notice__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: $font-sans;
  color: $lpb-graphite;
}

.notice__title {
  font-family: $font-display;
  font-size: 1.25rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.notice__text,
.notice__cta {
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0;
}

.notice__cta {
  font-weight: 600;
  color: $lpb-black;
}

.notice__points {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.92rem;

  i {
    color: $lpb-green-deep;
    margin-right: 0.4rem;
  }
}

@media (max-width: 560px) {
  .notice {
    flex-direction: column;
  }
}
</style>
