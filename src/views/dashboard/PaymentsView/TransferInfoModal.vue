<script setup lang="ts">
defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="tmodal-fade">
      <div
        v-if="show"
        class="tmodal"
        role="dialog"
        aria-modal="true"
        @click.self="emit('cancel')"
      >
        <div class="tmodal__panel">
          <h2 class="tmodal__title">Pago por transferencia bancaria</h2>

          <div class="tmodal__body">
            <div class="tmodal__detail">
              <span class="tmodal__label">Plan</span>
              <span class="tmodal__value">Anual completo (12 meses)</span>
            </div>
            <div class="tmodal__detail">
              <span class="tmodal__label">Pagas</span>
              <span class="tmodal__value">USD 400</span>
            </div>
            <div class="tmodal__detail">
              <span class="tmodal__label">Recibes</span>
              <span class="tmodal__value tmodal__value--highlight">12 meses de acceso</span>
            </div>
            <div class="tmodal__detail">
              <span class="tmodal__label">Duración</span>
              <span class="tmodal__value">12 meses</span>
            </div>
            <div class="tmodal__detail">
              <span class="tmodal__label">Descuento</span>
              <span class="tmodal__value tmodal__value--highlight">Exclusivo por transferencia</span>
            </div>
          </div>

          <div class="tmodal__highlight">
            <i class="fa-solid fa-bolt" />
            Un pago de <strong>USD 400</strong> por el <strong>año completo</strong>
          </div>

          <p class="tmodal__info">
            Al hacer clic en "Continuar a WhatsApp" serás redirigida a WhatsApp para solicitar los datos bancarios y completar tu pago. Una vez realizado, te confirmaremos tu acceso en menos de 24 horas.
          </p>

          <div class="tmodal__actions">
            <button class="tmodal__btn tmodal__btn--secondary" @click="emit('cancel')">
              Cancelar
            </button>
            <button class="tmodal__btn tmodal__btn--whatsapp" @click="emit('confirm')">
              <i class="fa-brands fa-whatsapp" />
              Continuar a WhatsApp
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.tmodal {
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

.tmodal__panel {
  width: 100%;
  max-width: 440px;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow: 0 24px 60px rgba($lpb-black, 0.2);
}

.tmodal__title {
  font-family: $font-display;
  font-size: 1.35rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0 0 1.25rem;
}

.tmodal__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.tmodal__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}

.tmodal__label {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.tmodal__value {
  font-family: $font-sans;
  font-size: 0.95rem;
  font-weight: 500;
  color: $lpb-black;

  &--highlight {
    color: $lpb-green-deep;
    font-weight: 600;
  }
}

.tmodal__strike {
  text-decoration: line-through;
  color: $lpb-muted;
  font-weight: 400;
}

.tmodal__highlight {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba($lpb-green, 0.1);
  border: 1px solid rgba($lpb-green, 0.25);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-black;
  font-weight: 500;
  margin-bottom: 1.25rem;

  i { color: $lpb-green-deep; }

  strong { color: $lpb-green-deep; }
}

.tmodal__info {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-graphite;
  line-height: 1.5;
  margin: 0 0 1.5rem;
}

.tmodal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.tmodal__btn {
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &--secondary {
    background: transparent;
    color: $lpb-graphite;
    border: 1px solid var(--border);

    &:hover {
      background: $lpb-cream;
    }
  }

  &--whatsapp {
    background: #25D366;
    color: $lpb-white;

    &:hover {
      background: #128C7E;
    }
  }
}

.tmodal-fade-enter-active,
.tmodal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tmodal-fade-enter-from,
.tmodal-fade-leave-to {
  opacity: 0;
}
</style>
