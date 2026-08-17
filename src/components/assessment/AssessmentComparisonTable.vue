<script setup lang="ts">
import { computed } from 'vue'
import type { AssessmentCheckpoint, PhysicalAssessment } from '@/types/assessment'
import {
  METRIC_SECTIONS,
  checkpointLabel,
  computeIMC,
  delta,
  deltaIsImprovement,
  formatDelta,
  formatValue,
  imcCategory,
  metricValue,
  sortedCheckpoints,
  type MetricDef,
} from '@/utils/assessmentMetrics'

const props = defineProps<{
  assessment: PhysicalAssessment
  editable?: boolean
  deletable?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', checkpoint: AssessmentCheckpoint): void
  (e: 'delete', checkpoint: AssessmentCheckpoint): void
}>()

const checkpoints = computed(() => sortedCheckpoints(props.assessment))

const imcValues = computed(() =>
  checkpoints.value.map((cp) =>
    computeIMC(cp.composicion.pesoKg, props.assessment.profile.estaturaCm),
  ),
)

function cellDelta(def: MetricDef, index: number): number | null {
  const current = checkpoints.value[index]
  const previous = checkpoints.value[index - 1]
  if (index === 0 || !current || !previous) return null
  return delta(metricValue(current, def), metricValue(previous, def))
}

function totalDelta(def: MetricDef): number | null {
  const first = checkpoints.value[0]
  const last = checkpoints.value[checkpoints.value.length - 1]
  if (checkpoints.value.length < 2 || !first || !last) return null
  return delta(metricValue(last, def), metricValue(first, def))
}

function imcAt(index: number): number | null {
  return imcValues.value[index] ?? null
}

function imcDelta(index: number): number | null {
  if (index === 0) return null
  return delta(imcAt(index), imcAt(index - 1))
}

const imcTotalDelta = computed(() => {
  if (imcValues.value.length < 2) return null
  return delta(imcAt(imcValues.value.length - 1), imcAt(0))
})

function deltaClass(value: number | null, betterWhen: 'down' | 'up') {
  const improved = deltaIsImprovement(value, betterWhen)
  return {
    'act__delta--good': improved === true,
    'act__delta--bad': improved === false,
  }
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="act">
    <div class="act__scroll">
      <table class="act__table">
        <thead>
          <tr>
            <th class="act__metric-head">Indicador</th>
            <th v-for="(cp, i) in checkpoints" :key="cp._id" class="act__cp-head">
              <div class="act__cp-head-inner">
                <span class="act__cp-label">{{ checkpointLabel(cp.monthIndex) }}</span>
                <span v-if="cp.date" class="act__cp-date">{{ formatDate(cp.date) }}</span>
                <div v-if="editable || deletable" class="act__cp-actions">
                  <button
                    v-if="editable"
                    class="act__cp-btn"
                    type="button"
                    title="Editar registro"
                    @click="emit('edit', cp)"
                  >
                    <i class="fa-solid fa-pen" />
                  </button>
                  <button
                    v-if="deletable"
                    class="act__cp-btn act__cp-btn--danger"
                    type="button"
                    title="Eliminar registro"
                    @click="emit('delete', cp)"
                  >
                    <i class="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
              <span class="act__sr">{{ i }}</span>
            </th>
            <th v-if="checkpoints.length > 1" class="act__total-head">Δ Total</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="section in METRIC_SECTIONS" :key="section.title">
            <tr class="act__section-row">
              <td :colspan="checkpoints.length + (checkpoints.length > 1 ? 2 : 1)">
                {{ section.title }}
              </td>
            </tr>
            <tr v-for="def in section.metrics" :key="def.key">
              <td class="act__metric">
                {{ def.label }}
                <span class="act__unit">{{ def.unit }}</span>
              </td>
              <td v-for="(cp, i) in checkpoints" :key="cp._id" class="act__value">
                <span class="act__number">{{ formatValue(metricValue(cp, def)) }}</span>
                <span
                  v-if="cellDelta(def, i) !== null"
                  class="act__delta"
                  :class="deltaClass(cellDelta(def, i), def.betterWhen)"
                >
                  {{ formatDelta(cellDelta(def, i)) }}
                </span>
              </td>
              <td v-if="checkpoints.length > 1" class="act__value act__value--total">
                <span
                  class="act__delta act__delta--lg"
                  :class="deltaClass(totalDelta(def), def.betterWhen)"
                >
                  {{ totalDelta(def) === null ? '—' : formatDelta(totalDelta(def)) }}
                </span>
              </td>
            </tr>
            <tr v-if="section.title === 'Composición corporal'">
              <td class="act__metric">
                IMC
                <span class="act__unit">kg/m²</span>
              </td>
              <td v-for="(cp, i) in checkpoints" :key="cp._id" class="act__value">
                <span class="act__number">{{ formatValue(imcAt(i)) }}</span>
                <span v-if="imcAt(i) !== null" class="act__imc-cat">
                  {{ imcCategory(imcAt(i)) }}
                </span>
                <span
                  v-if="imcDelta(i) !== null"
                  class="act__delta"
                  :class="deltaClass(imcDelta(i), 'down')"
                >
                  {{ formatDelta(imcDelta(i)) }}
                </span>
              </td>
              <td v-if="checkpoints.length > 1" class="act__value act__value--total">
                <span
                  class="act__delta act__delta--lg"
                  :class="deltaClass(imcTotalDelta, 'down')"
                >
                  {{ imcTotalDelta === null ? '—' : formatDelta(imcTotalDelta) }}
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <p v-if="!assessment.profile.estaturaCm" class="act__hint">
      <i class="fa-solid fa-circle-info" />
      Registra la estatura en los datos de la alumna para calcular el IMC automáticamente.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.act__scroll {
  overflow-x: auto;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  background: $lpb-white;
}

.act__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.act__metric-head,
.act__cp-head,
.act__total-head {
  padding: 0.85rem 1rem;
  text-align: left;
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: $lpb-white;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  white-space: nowrap;
}

.act__cp-head-inner {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.act__cp-label {
  font-size: 0.72rem;
}

.act__cp-date {
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.75;
  text-transform: none;
  letter-spacing: 0.02em;
}

.act__cp-actions {
  display: flex;
  gap: 0.35rem;
}

.act__cp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 0.4rem;
  background: rgba($lpb-white, 0.15);
  color: $lpb-white;
  font-size: 0.6rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($lpb-white, 0.3);
  }

  &--danger:hover {
    background: $alert-error;
  }
}

.act__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.act__section-row td {
  padding: 0.6rem 1rem;
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-green-deep;
  background: rgba($lpb-green, 0.08);
  border-top: 1px solid rgba($lpb-green-deep, 0.1);
}

.act__metric {
  padding: 0.6rem 1rem;
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-ink;
  border-top: 1px solid rgba($lpb-green-deep, 0.08);
  white-space: nowrap;
}

.act__unit {
  font-family: $font-mono;
  font-size: 0.6rem;
  color: $lpb-muted;
  text-transform: uppercase;
  margin-left: 0.3rem;
}

.act__value {
  padding: 0.6rem 1rem;
  border-top: 1px solid rgba($lpb-green-deep, 0.08);
  white-space: nowrap;

  &--total {
    background: rgba($lpb-green, 0.05);
  }
}

.act__number {
  font-family: $font-sans;
  font-size: 0.9rem;
  font-weight: 600;
  color: $lpb-black;
}

.act__imc-cat {
  display: block;
  font-family: $font-mono;
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $lpb-muted;
}

.act__delta {
  margin-left: 0.45rem;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  color: $lpb-muted;

  &--good {
    color: $alert-success;
  }

  &--bad {
    color: $alert-error;
  }

  &--lg {
    margin-left: 0;
    font-size: 0.85rem;
  }
}

.act__hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  font-family: $font-sans;
  font-size: 0.8rem;
  color: $lpb-muted;

  i {
    color: $lpb-amber;
  }
}
</style>
