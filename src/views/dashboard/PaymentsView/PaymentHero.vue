<script setup lang="ts">
import CountdownTimer from '@/components/ui/CountdownTimer.vue'

defineProps<{
  isActive: boolean
  planLabel: string
  isFoundingMember: boolean
  accessUntilLabel: string
  accessUntilDate: Date | null
}>()

const emit = defineEmits<{
  (e: 'go-to-payment-page'): void
}>()
</script>

<template>
  <section v-if="isActive" class="hero hero--active">
    <div class="hero__main">
      <div class="hero__badge-group">
        <span class="hero__plan-badge">{{ planLabel }}</span>
        <span v-if="isFoundingMember" class="hero__founder-badge">Fundador</span>
      </div>
      <h2 class="hero__access">Acceso hasta {{ accessUntilLabel }}</h2>
      <p class="hero__status">
        Tu suscripción está activa. Disfruta de la comunidad y todo el contenido de la academia.
      </p>
    </div>
    <div v-if="accessUntilDate" class="hero__timer">
      <CountdownTimer :target="accessUntilDate" label="Tiempo restante de acceso" />
    </div>
  </section>

  <section v-else class="hero">
    <div class="hero__main">
      <h2 class="hero__access">Elige tu plan</h2>
      <p class="hero__status">
        Elige entre 1, 3, 6 o 12 meses de acceso completo, desde <strong>USD 47</strong>.
      </p>
      <button class="hero__cta" @click="emit('go-to-payment-page')">
        Ver formas de pago
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 2rem 2.25rem;
  flex-wrap: wrap;

  &--active {
    background: linear-gradient(135deg, $lpb-green 0%, $lpb-green-dark 100%);
    color: $lpb-black;
    border-color: transparent;
  }
}

.hero__main {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 240px;
}

.hero__badge-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.hero__plan-badge {
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba($lpb-black, 0.08);
  color: $lpb-black;
}

.hero__founder-badge {
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: $lpb-black;
  color: $lpb-white;
}

.hero__access {
  font-family: $font-display;
  font-size: 1.85rem;
  font-weight: 400;
  margin: 0;
}

.hero__status {
  font-family: $font-sans;
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
  max-width: 55ch;
  line-height: 1.5;
}

.hero__cta {
  margin-top: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  background: $lpb-green;
  color: $lpb-black;
  cursor: pointer;
  transition: background 0.2s ease;
  width: fit-content;

  &:hover {
    background: $lpb-green-dark;
    color: $lpb-white;
  }
}

.hero__timer {
  flex: 0 0 auto;
}
</style>
