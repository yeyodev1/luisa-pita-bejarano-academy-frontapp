<script setup lang="ts">
import { REFUND_MAX_PERCENT, REFUND_WINDOW_DAYS } from '@/constants/legal'

/**
 * Aviso de la política de reembolso + casilla obligatoria de aceptación de los
 * Términos. Sin marcarla no se puede pagar.
 */
const accepted = defineModel<boolean>({ required: true })

defineProps<{ amount: number; showError?: boolean }>()
</script>

<template>
  <div class="consent">
    <div class="consent__notice" role="note">
      <p class="consent__title"><i class="fa-solid fa-circle-info" /> Antes de pagar, ten en cuenta:</p>
      <ul>
        <li>Es una <strong>suscripción mensual de USD {{ amount }}</strong> que se cobra automáticamente cada mes hasta que la canceles.</li>
        <li>Puedes <strong>cancelar la renovación cuando quieras</strong> desde tu cuenta.</li>
        <li>
          <strong>Reembolsos:</strong> solo dentro de los <strong>{{ REFUND_WINDOW_DAYS }} primeros días</strong> desde tu
          compra y por <strong>máximo el {{ REFUND_MAX_PERCENT }}% del monto pagado</strong>. Después no hay reembolsos.
        </li>
      </ul>
    </div>

    <label class="consent__check" :class="{ 'consent__check--error': showError && !accepted }">
      <input v-model="accepted" type="checkbox" />
      <span>
        Acepto unirme a la comunidad y los
        <RouterLink :to="{ name: 'terms' }" target="_blank" rel="noopener">Términos y condiciones</RouterLink>,
        incluida la
        <RouterLink :to="{ name: 'terms', hash: '#reembolsos' }" target="_blank" rel="noopener">política de reembolso</RouterLink>
        ({{ REFUND_MAX_PERCENT }}% máximo, solo en los {{ REFUND_WINDOW_DAYS }} primeros días).
      </span>
    </label>
    <p v-if="showError && !accepted" class="consent__error">Marca la casilla para continuar.</p>
  </div>
</template>

<style lang="scss" scoped>
.consent {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: $font-sans;
}

.consent__notice {
  border: 1px solid rgba($lpb-amber, 0.5);
  background: rgba($lpb-amber, 0.08);
  border-radius: 0.85rem;
  padding: 0.9rem 1rem;

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin: 0.4rem 0 0;
    padding-left: 1.1rem;
    font-size: 0.85rem;
    line-height: 1.5;
    color: $lpb-graphite;
  }

  strong {
    color: $lpb-black;
  }
}

.consent__title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: $lpb-black;

  i {
    color: darken($lpb-amber, 18%);
    margin-right: 0.3rem;
  }
}

.consent__check {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: $lpb-white;
  font-size: 0.88rem;
  line-height: 1.5;
  color: $lpb-graphite;
  cursor: pointer;

  input {
    flex-shrink: 0;
    width: 1.15rem;
    height: 1.15rem;
    margin-top: 0.15rem;
    accent-color: $lpb-green-deep;
    cursor: pointer;
  }

  a {
    color: $lpb-black;
    font-weight: 600;
    text-decoration: underline;
  }

  &--error {
    border-color: $alert-error;
    box-shadow: 0 0 0 3px rgba($alert-error, 0.1);
  }
}

.consent__error {
  margin: 0;
  font-size: 0.82rem;
  color: $alert-error;
}
</style>
