<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AssessmentCheckpoint, CheckpointPayload } from '@/types/assessment'
import {
  ESSENTIAL_METRICS,
  METRIC_SECTIONS,
  OPTIONAL_SECTIONS,
  checkpointLabel,
} from '@/utils/assessmentMetrics'

const props = defineProps<{
  checkpoint: AssessmentCheckpoint | null
  suggestedMonthIndex: number
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: CheckpointPayload): void
  (e: 'cancel'): void
}>()

const date = ref('')
const values = ref<Record<string, string>>({})
const showOptional = ref(false)

const fieldKey = (group: string, key: string) => `${group}.${key}`

/** El índice del mes se deriva; la alumna no debería tener que pensarlo. */
const monthIndex = computed(() =>
  props.checkpoint ? props.checkpoint.monthIndex : props.suggestedMonthIndex,
)

const isFirst = computed(() => monthIndex.value === 0)

const title = computed(() => {
  if (props.checkpoint) return `Editar ${checkpointLabel(props.checkpoint.monthIndex).toLowerCase()}`
  return isFirst.value ? 'Tu punto de partida' : `Tu registro del mes ${monthIndex.value}`
})

const subtitle = computed(() => {
  if (props.checkpoint) return 'Corrige lo que necesites y guarda.'
  return isFirst.value
    ? 'Con esto arrancamos. Anota lo que tengas a mano: con el peso y la cintura ya podemos medir tu avance.'
    : 'Solo toma un minuto. Anota lo que tengas a mano y listo.'
})

watch(
  () => [props.checkpoint, props.suggestedMonthIndex] as const,
  () => {
    const cp = props.checkpoint
    date.value = cp?.date ? cp.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
    const next: Record<string, string> = {}
    let hasOptional = false
    for (const section of METRIC_SECTIONS) {
      for (const metric of section.metrics) {
        const group = cp?.[metric.group] as Record<string, number | null> | undefined
        const value = group?.[metric.key]
        next[fieldKey(metric.group, metric.key)] = value != null ? String(value) : ''
        if (value != null && !metric.essential) hasOptional = true
      }
    }
    values.value = next
    // Si ya había datos opcionales guardados, se muestran abiertos al editar.
    showOptional.value = hasOptional
  },
  { immediate: true },
)

const filledCount = computed(
  () => Object.values(values.value).filter((v) => v !== '').length,
)

const optionalFilled = computed(() =>
  OPTIONAL_SECTIONS.reduce(
    (total, section) =>
      total +
      section.metrics.filter((m) => values.value[fieldKey(m.group, m.key)] !== '').length,
    0,
  ),
)

function buildGroup(group: string): Record<string, number | null> {
  const result: Record<string, number | null> = {}
  for (const section of METRIC_SECTIONS) {
    for (const metric of section.metrics) {
      if (metric.group !== group) continue
      const raw = values.value[fieldKey(metric.group, metric.key)]
      result[metric.key] = raw === '' || raw == null ? null : Number(raw)
    }
  }
  return result
}

function submit() {
  emit('submit', {
    monthIndex: monthIndex.value,
    date: date.value || null,
    composicion: buildGroup('composicion'),
    medidas: buildGroup('medidas'),
    evaluacion: buildGroup('evaluacion'),
  })
}
</script>

<template>
  <form class="cpf" @submit.prevent="submit">
    <header class="cpf__header">
      <h3 class="cpf__title">{{ title }}</h3>
      <p class="cpf__subtitle">{{ subtitle }}</p>
    </header>

    <div class="cpf__essentials">
      <label v-for="metric in ESSENTIAL_METRICS" :key="metric.key" class="cpf__field">
        <span class="cpf__label">{{ metric.label }}</span>
        <span class="cpf__input-wrap">
          <input
            v-model="values[fieldKey(metric.group, metric.key)]"
            type="number"
            min="0"
            step="0.1"
            inputmode="decimal"
            class="cpf__input"
            placeholder="0"
          />
          <span class="cpf__unit">{{ metric.unit }}</span>
        </span>
      </label>

      <label class="cpf__field cpf__field--date">
        <span class="cpf__label">Fecha</span>
        <span class="cpf__input-wrap">
          <input v-model="date" type="date" class="cpf__input" />
        </span>
      </label>
    </div>

    <button
      class="cpf__toggle"
      type="button"
      :aria-expanded="showOptional"
      @click="showOptional = !showOptional"
    >
      <i class="fa-solid" :class="showOptional ? 'fa-chevron-up' : 'fa-chevron-down'" />
      <span>{{ showOptional ? 'Ocultar' : 'Agregar' }} más medidas y pruebas</span>
      <span class="cpf__toggle-note">
        <template v-if="optionalFilled">{{ optionalFilled }} completadas</template>
        <template v-else>opcional</template>
      </span>
    </button>

    <Transition name="cpf-reveal">
      <div v-if="showOptional" class="cpf__optional">
        <fieldset v-for="section in OPTIONAL_SECTIONS" :key="section.title" class="cpf__section">
          <legend class="cpf__legend">{{ section.title }}</legend>
          <div class="cpf__grid">
            <label v-for="metric in section.metrics" :key="metric.key" class="cpf__field">
              <span class="cpf__label">{{ metric.label }}</span>
              <span class="cpf__input-wrap">
                <input
                  v-model="values[fieldKey(metric.group, metric.key)]"
                  type="number"
                  min="0"
                  step="0.1"
                  inputmode="decimal"
                  class="cpf__input"
                  placeholder="0"
                />
                <span class="cpf__unit">{{ metric.unit }}</span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>
    </Transition>

    <footer class="cpf__actions">
      <button class="cpf__btn cpf__btn--ghost" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button
        class="cpf__btn cpf__btn--primary"
        type="submit"
        :disabled="saving || filledCount === 0"
      >
        {{ saving ? 'Guardando…' : checkpoint ? 'Guardar cambios' : 'Guardar mi registro' }}
      </button>
    </footer>
  </form>
</template>

<style lang="scss" scoped>
.cpf {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.15);
  border-radius: 1.25rem;
}

.cpf__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cpf__title {
  font-family: $font-display;
  font-size: 1.5rem;
  color: $lpb-black;
  margin: 0;
}

.cpf__subtitle {
  font-family: $font-sans;
  font-size: 0.92rem;
  color: $lpb-graphite;
  margin: 0;
  line-height: 1.5;
  max-width: 52ch;
}

.cpf__essentials {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.cpf__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1 1 150px;
  min-width: 140px;

  &--date {
    flex: 1 1 170px;
  }
}

.cpf__label {
  font-family: $font-sans;
  font-size: 0.85rem;
  font-weight: 600;
  color: $lpb-ink;
}

.cpf__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.cpf__input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 0.75rem;
  background: $lpb-cream;
  font-family: $font-sans;
  font-size: 1.05rem;
  font-weight: 600;
  color: $lpb-black;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: rgba($lpb-muted, 0.55);
    font-weight: 400;
  }

  &:focus {
    outline: none;
    border-color: $lpb-green;
    background: $lpb-white;
    box-shadow: 0 0 0 3px rgba($lpb-green, 0.15);
  }
}

.cpf__unit {
  position: absolute;
  right: 1rem;
  font-family: $font-sans;
  font-size: 0.8rem;
  color: $lpb-muted;
  pointer-events: none;
}

.cpf__toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  align-self: flex-start;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  border: 1px dashed rgba($lpb-green-deep, 0.3);
  background: transparent;
  color: $lpb-green-deep;
  font-family: $font-sans;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba($lpb-green, 0.08);
    border-color: $lpb-green;
  }

  i {
    font-size: 0.7rem;
  }
}

.cpf__toggle-note {
  font-family: $font-sans;
  font-size: 0.75rem;
  font-weight: 500;
  color: $lpb-muted;
}

.cpf__optional {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow: hidden;
}

.cpf__section {
  border: none;
  border-top: 1px solid rgba($lpb-green-deep, 0.12);
  padding: 1.25rem 0 0;
  margin: 0;
}

.cpf__legend {
  font-family: $font-sans;
  font-size: 0.9rem;
  font-weight: 700;
  color: $lpb-black;
  padding: 0;
  margin-bottom: 0.9rem;
}

.cpf__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.cpf__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.cpf__btn {
  padding: 0.8rem 1.6rem;
  border-radius: 999px;
  font-family: $font-sans;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  &--ghost {
    background: transparent;
    border: 1px solid rgba($lpb-green-deep, 0.22);
    color: $lpb-graphite;

    &:hover {
      background: rgba($lpb-green-deep, 0.06);
      color: $lpb-black;
    }
  }

  &--primary {
    background: $lpb-green-deep;
    color: $lpb-white;

    &:hover:not(:disabled) {
      background: $lpb-green-dark;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}

.cpf-reveal-enter-active,
.cpf-reveal-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.7, 0, 1);
}

.cpf-reveal-enter-from,
.cpf-reveal-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .cpf-reveal-enter-active,
  .cpf-reveal-leave-active {
    transition: opacity 0.15s ease;
  }

  .cpf-reveal-enter-from,
  .cpf-reveal-leave-to {
    transform: none;
  }
}

@media (max-width: 640px) {
  .cpf {
    padding: 1.5rem 1.25rem;
  }

  .cpf__actions {
    flex-direction: column-reverse;
  }

  .cpf__btn {
    width: 100%;
  }
}
</style>
