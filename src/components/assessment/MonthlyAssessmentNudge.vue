<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { contentService } from '@/services/contentService'
import { hasCheckpointInMonth } from '@/utils/assessmentMetrics'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const visible = ref(false)

const monthKey = () => {
  const now = new Date()
  return `assessment-nudge-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const monthName = computed(() =>
  new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }),
)

onMounted(async () => {
  if (userStore.role === 'admin') return
  if (!userStore.hasActiveAccess) return
  if (route.name === 'my-progress') return
  if (sessionStorage.getItem(monthKey())) return
  try {
    const res = await contentService.getMyAssessment()
    if (!hasCheckpointInMonth(res.data.data)) visible.value = true
  } catch {
    // Silencioso: el nudge nunca debe romper el dashboard.
  }
})

function dismiss() {
  sessionStorage.setItem(monthKey(), '1')
  visible.value = false
}

function goRegister() {
  dismiss()
  router.push({ name: 'my-progress', query: { registrar: '1' } })
}
</script>

<template>
  <transition name="nudge-fade">
    <div v-if="visible" class="nudge" role="dialog" aria-modal="true" aria-label="Registro mensual">
      <div class="nudge__backdrop" @click="dismiss" />
      <div class="nudge__card">
        <div class="nudge__icon">
          <i class="fa-solid fa-weight-scale" />
        </div>
        <h2 class="nudge__title">¡Es hora de medir tu progreso!</h2>
        <p class="nudge__text">
          Aún no registras tus medidas de <strong>{{ monthName }}</strong
          >. Toma 3 minutos: peso, medidas y pruebas físicas. Así verás cuánto has avanzado mes a
          mes.
        </p>
        <div class="nudge__actions">
          <button class="nudge__btn nudge__btn--primary" type="button" @click="goRegister">
            <i class="fa-solid fa-plus" />
            Registrar ahora
          </button>
          <button class="nudge__btn nudge__btn--ghost" type="button" @click="dismiss">
            Más tarde
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.nudge {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.nudge__backdrop {
  position: absolute;
  inset: 0;
  background: rgba($lpb-black, 0.55);
  backdrop-filter: blur(4px);
}

.nudge__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  max-width: 420px;
  padding: 2.25rem 2rem;
  background: $lpb-paper;
  border-radius: 1.25rem;
  border: 1px solid rgba($lpb-green-deep, 0.15);
  box-shadow: 0 24px 64px rgba($lpb-black, 0.25);
  text-align: center;
}

.nudge__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba($lpb-green, 0.14);
  color: $lpb-green-deep;
  font-size: 1.6rem;
}

.nudge__title {
  font-family: $font-display;
  font-size: 1.4rem;
  color: $lpb-black;
  margin: 0;
}

.nudge__text {
  font-family: $font-sans;
  font-size: 0.92rem;
  color: $lpb-graphite;
  margin: 0;
  line-height: 1.5;
}

.nudge__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.nudge__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &--primary {
    background: $lpb-green-deep;
    color: $lpb-white;

    &:hover {
      background: $lpb-green-dark;
    }
  }

  &--ghost {
    background: transparent;
    border: 1px solid rgba($lpb-green-deep, 0.25);
    color: $lpb-graphite;

    &:hover {
      background: rgba($lpb-green-deep, 0.06);
      color: $lpb-black;
    }
  }
}

.nudge-fade-enter-active,
.nudge-fade-leave-active {
  transition: opacity 0.3s ease;
}

.nudge-fade-enter-from,
.nudge-fade-leave-to {
  opacity: 0;
}
</style>
