<script setup lang="ts">
defineProps<{
  loading: boolean
  isMonthlyAvailable: boolean
  monthlyPrice: number
  annualPrice: number
}>()

const emit = defineEmits<{
  (e: 'pay-monthly'): void
  (e: 'pay-annual'): void
  (e: 'open-transfer'): void
}>()
</script>

<template>
  <section class="plans">
    <h3 class="plans__title">Planes disponibles</h3>
    <div class="plans__grid">
      <div class="plan" :class="{ 'plan--soon': !isMonthlyAvailable }">
        <div v-if="!isMonthlyAvailable" class="plan__badge plan__badge--soon">
          Desde el 16 de julio
        </div>
        <div v-else class="plan__badge plan__badge--simple">Flexible</div>

        <div class="plan__header">
          <span class="plan__name">Mensualidad</span>
        </div>
        <div class="plan__pricing">
          <span class="plan__price">USD {{ monthlyPrice }}</span>
          <span class="plan__period">/ mes</span>
        </div>
        <p class="plan__desc">Acceso por 1 mes. Renovable cuando lo necesites.</p>
        <div class="plan__values">
          <span class="plan__regular">Valor regular: USD 47/mes</span>
        </div>
        <button
          v-if="isMonthlyAvailable"
          class="plan__cta"
          :disabled="loading"
          @click="emit('pay-monthly')"
        >
          {{ loading ? 'Preparando…' : 'Pagar mensualidad' }}
        </button>
        <button v-else class="plan__cta plan__cta--disabled" disabled>
          No disponible hasta el 16 de julio
        </button>
      </div>

      <div class="plan plan--featured">
        <div class="plan__badge plan__badge--featured">Recomendado</div>

        <div class="plan__header">
          <span class="plan__name">Anualidad</span>
        </div>
        <div class="plan__pricing">
          <span class="plan__price plan__price--big">USD {{ annualPrice }}</span>
          <span class="plan__year">/ año</span>
        </div>

        <div class="plan__deal">
          <div class="plan__deal-icon">
            <i class="fa-solid fa-arrow-right-arrow-left" />
          </div>
          <div class="plan__deal-cols">
            <div class="plan__deal-col">
              <span class="plan__deal-label">Pagas</span>
              <span class="plan__deal-value">6 meses</span>
            </div>
            <div class="plan__deal-arrow"><i class="fa-solid fa-arrow-right-long" /></div>
            <div class="plan__deal-col">
              <span class="plan__deal-label">Recibes</span>
              <span class="plan__deal-value plan__deal-value--highlight">12 meses</span>
            </div>
          </div>
        </div>

        <div class="plan__compare">
          <div class="plan__compare-row">
            <span class="plan__compare-label">Valor regular</span>
            <span class="plan__compare-old">USD 470</span>
          </div>
          <div class="plan__compare-row">
            <span class="plan__compare-label">Precio preventa</span>
            <span class="plan__compare-new">USD {{ annualPrice }}</span>
          </div>
          <div class="plan__compare-divider" />
          <div class="plan__compare-row plan__compare-row--total">
            <span class="plan__compare-label">Ahorras</span>
            <span class="plan__compare-save">USD {{ 470 - annualPrice }}</span>
          </div>
        </div>

        <div class="plan__methods">
          <button class="plan__method plan__method--card" :disabled="loading" @click="emit('pay-annual')">
            <i class="fa-regular fa-credit-card" />
            <div class="plan__method-body">
              <span class="plan__method-title">Pago automático</span>
              <span class="plan__method-hint">Acceso inmediato</span>
            </div>
          </button>
          <button type="button" class="plan__method plan__method--whatsapp" @click="emit('open-transfer')">
            <i class="fa-brands fa-whatsapp" />
            <div class="plan__method-body">
              <span class="plan__method-title">Transferencia bancaria</span>
              <span class="plan__method-hint">Verificación hasta 24 horas</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.plans {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plans__title {
  font-family: $font-display;
  font-size: 1.25rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.plans__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 2rem 1.5rem 1.5rem;
  transition: box-shadow 0.25s ease;

  &--featured {
    border-color: $lpb-green;
    box-shadow: 0 12px 32px rgba($lpb-green, 0.1);
  }

  &--soon {
    background: rgba($lpb-white, 0.6);
  }
}

.plan__badge {
  position: absolute;
  top: -0.6rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: $font-mono;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  white-space: nowrap;

  &--simple { background: rgba($lpb-black, 0.06); color: $lpb-muted; }
  &--featured { background: $lpb-green; color: $lpb-black; }
  &--soon { background: rgba($lpb-black, 0.06); color: $lpb-muted; }
}

.plan__header {
  margin-top: 0.5rem;
}

.plan__name {
  font-family: $font-display;
  font-size: 1.15rem;
  font-weight: 400;
  color: $lpb-black;
}

.plan__pricing {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.plan__price {
  font-family: $font-display;
  font-size: 2rem;
  font-weight: 500;
  color: $lpb-green-deep;
  line-height: 1.1;

  &--big {
    font-size: 2.4rem;
    font-weight: 600;
  }
}

.plan__period,
.plan__year {
  font-family: $font-mono;
  font-size: 0.7rem;
  color: $lpb-muted;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.plan__desc {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-graphite;
  margin: 0;
  line-height: 1.5;
  flex: 1 1 auto;
}

/* ── Deal callout: 6 → 12 months ── */
.plan__deal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba($lpb-amber, 0.1) 0%, rgba($lpb-amber, 0.04) 100%);
  border: 1px solid rgba($lpb-amber, 0.2);
  border-radius: 0.75rem;
}

.plan__deal-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $lpb-amber;
  border-radius: 50%;
  flex-shrink: 0;
  color: $lpb-black;
  font-size: 1rem;
}

.plan__deal-cols {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.plan__deal-col {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.plan__deal-label {
  font-family: $font-mono;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.plan__deal-value {
  font-family: $font-display;
  font-size: 1.1rem;
  font-weight: 500;
  color: $lpb-black;

  &--highlight {
    color: $lpb-green-deep;
    font-weight: 600;
  }
}

.plan__deal-arrow {
  color: $lpb-muted;
  font-size: 1rem;
}

/* ── Price comparison ── */
.plan__compare {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem 1rem;
  background: $lpb-cream;
  border-radius: 0.75rem;
}

.plan__compare-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &--total { padding-top: 0.35rem; }
}

.plan__compare-label {
  font-family: $font-sans;
  font-size: 0.8rem;
  color: $lpb-graphite;
}

.plan__compare-old {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-muted;
  text-decoration: line-through;
}

.plan__compare-new {
  font-family: $font-mono;
  font-size: 0.85rem;
  font-weight: 700;
  color: $lpb-green-deep;
}

.plan__compare-divider {
  height: 1px;
  background: var(--border);
  margin: 0.15rem 0;
}

.plan__compare-save {
  font-family: $font-mono;
  font-size: 0.85rem;
  font-weight: 700;
  color: $lpb-green-deep;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Payment methods ── */
.plan__methods {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan__method {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  font-family: $font-sans;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  i { font-size: 1.1rem; flex-shrink: 0; }

  &--card {
    background: $lpb-green-deep;
    border: none;
    color: $lpb-white;

    &:hover:not(:disabled) { background: #1a6b55; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &--whatsapp {
    background: #128C7E;
    border: none;
    color: $lpb-white;

    &:hover:not(:disabled) { background: #0e6b5f; }
  }
}

.plan__method-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  text-align: left;
}

.plan__method-title {
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-white;
}

.plan__method-hint {
  font-family: $font-sans;
  font-size: 0.75rem;
  color: rgba($lpb-white, 0.85);
  font-weight: 500;
}

/* ── Shared values ── */
.plan__values {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  background: $lpb-cream;
  border-radius: 0.75rem;
}

.plan__regular {
  font-family: $font-sans;
  font-size: 0.8rem;
  color: $lpb-muted;
  text-decoration: line-through;

  strong { color: $lpb-graphite; }
}

.plan__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: $lpb-black;
  color: $lpb-white;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.9rem 1.25rem;
  border-radius: 999px;
  transition: background 0.2s ease, opacity 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) { background: $lpb-ink; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &--disabled { opacity: 0.5; cursor: not-allowed; }
}

@media (max-width: 900px) {
  .plans__grid { grid-template-columns: 1fr; }

  .plan__badge {
    position: static;
    transform: none;
    width: fit-content;
  }

  .plan__header { margin-top: 0; }
}
</style>
