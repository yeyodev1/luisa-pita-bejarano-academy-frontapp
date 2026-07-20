<script setup lang="ts">
import { reactive, watch } from 'vue'
import PayphoneBox from './PayphoneBox.vue'
import type { PaymentBoxConfig } from '@/services/paymentService'
import type { PaymentPlan } from '@/constants/paymentPlans'

const props = defineProps<{
  open: boolean
  plan: PaymentPlan
  price: number
  loading: boolean
  error?: string
  boxConfig?: PaymentBoxConfig | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { email: string; name: string; lastName: string }): void
  (e: 'box-error', message: string): void
}>()

const form = reactive({
  email: '',
  name: '',
  lastName: '',
})

watch(() => props.open, (open) => {
  if (open) {
    form.email = ''
    form.name = ''
    form.lastName = ''
  }
})

function onSubmit() {
  emit('submit', {
    email: form.email.trim(),
    name: form.name.trim(),
    lastName: form.lastName.trim(),
  })
}

function onClose() {
  emit('close')
}

function onBoxError(message: string) {
  emit('box-error', message)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="checkout-modal" @click.self="onClose">
        <div class="checkout-modal__panel">
          <div class="checkout-modal__header">
            <h2 class="checkout-modal__title">
              {{ boxConfig ? 'Pago seguro' : 'Completar pago' }}
            </h2>
            <button class="checkout-modal__close" type="button" @click="onClose">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <template v-if="boxConfig">
            <p class="checkout-modal__description">
              Completa el pago con Payphone. Serás redirigida al finalizar.
            </p>
            <PayphoneBox :config="boxConfig" @error="onBoxError" />
            <p v-if="error" class="checkout-modal__feedback checkout-modal__feedback--error">{{ error }}</p>
          </template>

          <template v-else>
            <p class="checkout-modal__description">
              Ingresa tus datos para continuar al pago seguro. Te enviaremos tus credenciales de acceso por email.
            </p>
            <form class="checkout-modal__form" @submit.prevent="onSubmit">
              <label class="checkout-modal__field">
                <span class="checkout-modal__label">Correo electrónico</span>
                <input
                  v-model="form.email"
                  type="email"
                  class="checkout-modal__input"
                  placeholder="tu@email.com"
                  required
                />
              </label>
              <div class="checkout-modal__grid">
                <label class="checkout-modal__field">
                  <span class="checkout-modal__label">Nombre</span>
                  <input
                    v-model="form.name"
                    type="text"
                    class="checkout-modal__input"
                    placeholder="Ej. Luisa"
                    required
                  />
                </label>
                <label class="checkout-modal__field">
                  <span class="checkout-modal__label">Apellido</span>
                  <input
                    v-model="form.lastName"
                    type="text"
                    class="checkout-modal__input"
                    placeholder="Ej. Pita"
                    required
                  />
                </label>
              </div>
              <div class="checkout-modal__summary">
                <span class="checkout-modal__summary-label">Total a pagar</span>
                <span class="checkout-modal__summary-value">USD {{ price }}</span>
              </div>
              <p v-if="error" class="checkout-modal__feedback checkout-modal__feedback--error">{{ error }}</p>
              <div class="checkout-modal__actions">
                <button
                  type="button"
                  class="checkout-modal__btn checkout-modal__btn--ghost"
                  @click="onClose"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="checkout-modal__btn checkout-modal__btn--primary"
                  :disabled="loading"
                >
                  <i v-if="loading" class="fa-solid fa-circle-notch fa-spin" />
                  <i v-else class="fa-solid fa-lock" />
                  {{ loading ? 'Preparando…' : 'Pagar con tarjeta' }}
                </button>
              </div>
            </form>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.checkout-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
  background: rgba($lpb-black, 0.5);
  backdrop-filter: blur(6px);
  -webkit-overflow-scrolling: touch;
}

.checkout-modal__panel {
  width: 100%;
  max-width: 480px;
  margin: auto 0;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 24px 80px rgba($lpb-black, 0.25);
}

.checkout-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.checkout-modal__title {
  font-family: $font-display;
  font-size: 1.5rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.checkout-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $lpb-muted;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: $lpb-cream;
    color: $lpb-black;
  }
}

.checkout-modal__description {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.checkout-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout-modal__grid {
  display: flex;
  gap: 1rem;

  .checkout-modal__field { flex: 1 1 0; }
}

.checkout-modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.checkout-modal__label {
  font-family: $font-sans;
  font-size: 0.85rem;
  font-weight: 500;
  color: $lpb-graphite;
}

.checkout-modal__input {
  font-family: $font-sans;
  font-size: 0.95rem;
  color: $lpb-black;
  background: $lpb-cream;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  padding: 0.8rem 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: $lpb-green;
    box-shadow: 0 0 0 3px rgba($lpb-green, 0.12);
  }

  &::placeholder {
    color: $lpb-muted;
  }
}

.checkout-modal__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: rgba($lpb-green, 0.06);
  border: 1px solid rgba($lpb-green, 0.2);
  border-radius: 1rem;
}

.checkout-modal__summary-label {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
}

.checkout-modal__summary-value {
  font-family: $font-display;
  font-size: 1.35rem;
  color: $lpb-green-deep;
}

.checkout-modal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.checkout-modal__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.8rem 1.25rem;
  border-radius: 999px;
  transition: background 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.checkout-modal__btn--primary {
  background: $lpb-black;
  color: $lpb-white;

  &:hover:not(:disabled) {
    background: $lpb-ink;
    transform: translateY(-1px);
  }
}

.checkout-modal__btn--ghost {
  background: $lpb-white;
  color: $lpb-graphite;
  border-color: var(--border);

  &:hover:not(:disabled) {
    background: $lpb-cream;
    border-color: rgba($lpb-black, 0.15);
  }
}

.checkout-modal__feedback {
  font-family: $font-sans;
  font-size: 0.85rem;
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.75rem;
  text-align: center;

  &--error {
    color: $alert-error;
    background: $alert-error-bg;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .checkout-modal__panel,
.modal-leave-active .checkout-modal__panel {
  transition: transform 0.3s cubic-bezier(0.2, 0.7, 0, 1), opacity 0.25s ease;
}

.modal-enter-from .checkout-modal__panel,
.modal-leave-to .checkout-modal__panel {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@media (max-width: 720px) {
  .checkout-modal__grid {
    flex-direction: column;
  }
}
</style>
