<script setup lang="ts">
import type { NuveiSavedCard } from '@/services/paymentService'

defineProps<{
  cards: NuveiSavedCard[]
  loading: boolean
  busyToken: string | null
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'make-default', card: NuveiSavedCard): void
  (e: 'remove', card: NuveiSavedCard): void
}>()

const BRANDS: Record<string, string> = {
  vi: 'Visa',
  mc: 'Mastercard',
  ax: 'American Express',
  di: 'Diners',
  dc: 'Diners',
  dn: 'Discover',
}

function brand(card: NuveiSavedCard) {
  return (card.brand && BRANDS[card.brand]) || card.brand?.toUpperCase() || 'Tarjeta'
}

function statusNote(card: NuveiSavedCard) {
  if (card.status === 'valid') return ''
  if (card.status === 'pending') return 'Falta verificar con el código de tu banco'
  if (card.status === 'review') return 'En revisión por Nuvei'
  return 'Rechazada'
}
</script>

<template>
  <section class="cards-box">
    <div class="cards-box__head">
      <div>
        <span class="cards-box__eyebrow">Métodos de pago</span>
        <h3 class="cards-box__title">Mis tarjetas</h3>
      </div>
      <button class="cards-box__add" type="button" @click="emit('add')">
        <i class="fa-solid fa-plus" /> Agregar tarjeta
      </button>
    </div>

    <p v-if="loading" class="cards-box__empty"><i class="fa-solid fa-spinner fa-spin" /> Cargando tarjetas…</p>
    <p v-else-if="!cards.length" class="cards-box__empty">
      Aún no tienes tarjetas guardadas. Agrega una para activar tu suscripción.
    </p>

    <ul v-else class="cards-box__list">
      <li v-for="card in cards" :key="card.token" class="cards-box__item">
        <i class="fa-regular fa-credit-card cards-box__icon" />
        <div class="cards-box__info">
          <strong>{{ brand(card) }} •••• {{ card.last4 }}</strong>
          <small>
            <template v-if="card.expiryMonth">Vence {{ card.expiryMonth.padStart(2, '0') }}/{{ card.expiryYear }}</template>
            <template v-if="statusNote(card)"> · {{ statusNote(card) }}</template>
          </small>
        </div>
        <span v-if="card.isDefault" class="cards-box__default">Principal</span>
        <div class="cards-box__actions">
          <button
            v-if="!card.isDefault && card.status === 'valid'"
            type="button"
            :disabled="busyToken !== null"
            @click="emit('make-default', card)"
          >
            {{ busyToken === card.token ? 'Guardando…' : 'Hacer principal' }}
          </button>
          <button
            type="button"
            class="cards-box__remove"
            :disabled="busyToken !== null"
            :aria-label="`Eliminar tarjeta terminada en ${card.last4}`"
            @click="emit('remove', card)"
          >
            <i class="fa-regular fa-trash-can" />
          </button>
        </div>
      </li>
    </ul>

    <p class="cards-box__note">
      Los cobros de tu suscripción se hacen a la tarjeta <strong>principal</strong>. Puedes cambiarla cuando quieras.
    </p>
  </section>
</template>

<style lang="scss" scoped>
.cards-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
}

.cards-box__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cards-box__eyebrow {
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cards-box__title {
  font-family: $font-display;
  font-size: 1.25rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0.2rem 0 0;
}

.cards-box__add {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: $font-mono;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;

  &:hover {
    background: $lpb-green-dark;
  }
}

.cards-box__empty,
.cards-box__note {
  font-family: $font-sans;
  font-size: 0.88rem;
  color: $lpb-graphite;
  margin: 0;
}

.cards-box__note {
  font-size: 0.8rem;
  color: $lpb-muted;
}

.cards-box__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cards-box__item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: $lpb-cream;
}

.cards-box__icon {
  font-size: 1.2rem;
  color: $lpb-graphite;
}

.cards-box__info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-family: $font-sans;

  strong {
    color: $lpb-black;
    font-size: 0.95rem;
  }

  small {
    color: $lpb-muted;
    font-size: 0.8rem;
  }
}

.cards-box__default {
  font-family: $font-mono;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: rgba($lpb-green, 0.14);
  color: $lpb-green-deep;
}

.cards-box__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;

  button {
    font-family: $font-mono;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: $lpb-graphite;
    padding: 0.5rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: $lpb-white;

    &:hover:not(:disabled) {
      background: $lpb-paper;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.cards-box__remove {
  width: 2.1rem;
  padding: 0.5rem !important;
}

@media (max-width: 560px) {
  .cards-box__item {
    flex-wrap: wrap;
  }

  .cards-box__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
