<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AssessmentCheckpoint, CheckpointPayload } from '@/types/assessment'
import { METRIC_SECTIONS, checkpointLabel } from '@/utils/assessmentMetrics'

const props = defineProps<{
  checkpoint: AssessmentCheckpoint | null
  suggestedMonthIndex: number
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: CheckpointPayload): void
  (e: 'cancel'): void
}>()

const monthIndex = ref('0')
const date = ref('')
const values = ref<Record<string, string>>({})

const fieldKey = (group: string, key: string) => `${group}.${key}`

watch(
  () => [props.checkpoint, props.suggestedMonthIndex] as const,
  () => {
    const cp = props.checkpoint
    monthIndex.value = String(cp ? cp.monthIndex : props.suggestedMonthIndex)
    date.value = cp
      ? cp.date
        ? cp.date.slice(0, 10)
        : ''
      : new Date().toISOString().slice(0, 10)
    const next: Record<string, string> = {}
    for (const section of METRIC_SECTIONS) {
      for (const metric of section.metrics) {
        const group = cp?.[metric.group] as Record<string, number | null> | undefined
        const value = group?.[metric.key]
        next[fieldKey(metric.group, metric.key)] = value != null ? String(value) : ''
      }
    }
    values.value = next
  },
  { immediate: true },
)

const title = computed(() =>
  props.checkpoint
    ? `Editar ${checkpointLabel(props.checkpoint.monthIndex)}`
    : `Nuevo registro — ${checkpointLabel(Number(monthIndex.value) || 0)}`,
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
    monthIndex: Number(monthIndex.value),
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
      <div class="cpf__meta">
        <label class="cpf__field cpf__field--sm">
          <span class="cpf__label">Mes (0 = inicial)</span>
          <input v-model="monthIndex" type="number" min="0" step="1" class="cpf__input" required />
        </label>
        <label class="cpf__field cpf__field--sm">
          <span class="cpf__label">Fecha</span>
          <input v-model="date" type="date" class="cpf__input" />
        </label>
      </div>
    </header>

    <fieldset v-for="section in METRIC_SECTIONS" :key="section.title" class="cpf__section">
      <legend class="cpf__legend">{{ section.title }}</legend>
      <div class="cpf__grid">
        <label v-for="metric in section.metrics" :key="metric.key" class="cpf__field">
          <span class="cpf__label">{{ metric.label }} ({{ metric.unit }})</span>
          <input
            v-model="values[fieldKey(metric.group, metric.key)]"
            type="number"
            min="0"
            step="0.1"
            class="cpf__input"
            placeholder="—"
          />
        </label>
      </div>
    </fieldset>

    <footer class="cpf__actions">
      <button class="cpf__btn cpf__btn--ghost" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button class="cpf__btn cpf__btn--primary" type="submit" :disabled="saving">
        <i class="fa-solid fa-floppy-disk" />
        {{ saving ? 'Guardando…' : checkpoint ? 'Guardar cambios' : 'Registrar' }}
      </button>
    </footer>
  </form>
</template>

<style lang="scss" scoped>
.cpf {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.15);
  border-radius: 1rem;
}

.cpf__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.cpf__title {
  font-family: $font-display;
  font-size: 1.25rem;
  color: $lpb-black;
  margin: 0;
}

.cpf__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.cpf__section {
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
  margin: 0;
}

.cpf__legend {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-green-deep;
  padding: 0 0.5rem;
}

.cpf__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.cpf__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1 1 160px;
  min-width: 150px;

  &--sm {
    flex: 0 1 160px;
  }
}

.cpf__label {
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.cpf__input {
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 0.6rem;
  background: $lpb-cream;
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-ink;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus {
    outline: none;
    border-color: $lpb-green;
    background: $lpb-white;
  }
}

.cpf__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cpf__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &--ghost {
    background: transparent;
    border: 1px solid rgba($lpb-green-deep, 0.25);
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
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
