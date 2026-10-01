<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  AssessmentCheckpoint,
  AssessmentPhoto,
  AssessmentPhotoPose,
  CheckpointPayload,
} from '@/types/assessment'
import {
  ESSENTIAL_METRICS,
  METRIC_SECTIONS,
  OPTIONAL_SECTIONS,
  PHOTO_POSES,
  checkpointLabel,
} from '@/utils/assessmentMetrics'

const props = defineProps<{
  checkpoint: AssessmentCheckpoint | null
  suggestedMonthIndex: number
  saving: boolean
  /** Sube una foto y devuelve su publicId + URL firmada (alumna o admin). */
  uploadPhoto: (file: File) => Promise<{ publicId: string; url: string }>
}>()

const emit = defineEmits<{
  (e: 'submit', payload: CheckpointPayload): void
  (e: 'cancel'): void
}>()

const date = ref('')
const values = ref<Record<string, string>>({})
const showOptional = ref(false)
const photos = ref<Partial<Record<AssessmentPhotoPose, AssessmentPhoto>>>({})
const uploadingPose = ref<AssessmentPhotoPose | null>(null)
const photoError = ref('')
/** Tras el primer intento de guardar se marcan en rojo los obligatorios vacíos. */
const triedSubmit = ref(false)

const PESO = ESSENTIAL_METRICS.filter((m) => m.group === 'composicion')
const MEDIDAS = ESSENTIAL_METRICS.filter((m) => m.group === 'medidas')

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
    ? 'Con esto arrancamos. Necesitas una báscula y una cinta métrica: el peso y las medidas son obligatorios.'
    : 'Báscula y cinta métrica a la mano: el peso y las medidas son obligatorios para ver tu avance.'
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
    photos.value = Object.fromEntries((cp?.photos ?? []).map((p) => [p.pose, p]))
    triedSubmit.value = false
    photoError.value = ''
    // Si ya había datos opcionales guardados, se muestran abiertos al editar.
    showOptional.value = hasOptional
  },
  { immediate: true },
)

const isEmpty = (group: string, key: string) => {
  const raw = values.value[fieldKey(group, key)]
  return raw === '' || raw == null
}

const missingRequired = computed(() =>
  ESSENTIAL_METRICS.filter((m) => isEmpty(m.group, m.key)),
)

const requiredDone = computed(() => ESSENTIAL_METRICS.length - missingRequired.value.length)

const showMissing = (group: string, key: string) => triedSubmit.value && isEmpty(group, key)

async function onPhotoSelected(pose: AssessmentPhotoPose, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'La foto pesa más de 5 MB. Prueba con otra o redúcela.'
    return
  }
  photoError.value = ''
  uploadingPose.value = pose
  try {
    const { publicId, url } = await props.uploadPhoto(file)
    photos.value = { ...photos.value, [pose]: { pose, publicId, url } }
  } catch (err) {
    photoError.value =
      (err as { message?: string })?.message || 'No se pudo subir la foto. Intenta de nuevo.'
  } finally {
    uploadingPose.value = null
  }
}

function removePhoto(pose: AssessmentPhotoPose) {
  const next = { ...photos.value }
  delete next[pose]
  photos.value = next
}

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
  triedSubmit.value = true
  if (missingRequired.value.length) {
    const first = missingRequired.value[0]
    if (first) document.getElementById(`cpf-${first.group}-${first.key}`)?.focus()
    return
  }
  emit('submit', {
    monthIndex: monthIndex.value,
    date: date.value || null,
    composicion: buildGroup('composicion'),
    medidas: buildGroup('medidas'),
    evaluacion: buildGroup('evaluacion'),
    photos: Object.values(photos.value)
      .filter((p): p is AssessmentPhoto => Boolean(p))
      .map(({ pose, publicId }) => ({ pose, publicId })),
  })
}
</script>

<template>
  <form class="cpf" novalidate @submit.prevent="submit">
    <header class="cpf__header">
      <h3 class="cpf__title">{{ title }}</h3>
      <p class="cpf__subtitle">{{ subtitle }}</p>
    </header>

    <div class="cpf__progress" :class="{ 'cpf__progress--done': !missingRequired.length }">
      <i class="fa-solid" :class="missingRequired.length ? 'fa-ruler' : 'fa-circle-check'" />
      <span v-if="missingRequired.length">
        Obligatorio: <strong>{{ requiredDone }} de {{ ESSENTIAL_METRICS.length }}</strong> datos
        completos
      </span>
      <span v-else>Peso y medidas completos. ¡Listo para guardar!</span>
    </div>

    <fieldset class="cpf__section cpf__section--required">
      <legend class="cpf__legend">
        Peso y fecha <span class="cpf__required-tag">Obligatorio</span>
      </legend>
      <div class="cpf__essentials">
        <label v-for="metric in PESO" :key="metric.key" class="cpf__field">
          <span class="cpf__label">{{ metric.label }} <span class="cpf__star">*</span></span>
          <span class="cpf__input-wrap">
            <input
              :id="`cpf-${metric.group}-${metric.key}`"
              v-model="values[fieldKey(metric.group, metric.key)]"
              type="number"
              min="0"
              step="0.1"
              inputmode="decimal"
              class="cpf__input"
              :class="{ 'cpf__input--missing': showMissing(metric.group, metric.key) }"
              :aria-invalid="showMissing(metric.group, metric.key)"
              required
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
    </fieldset>

    <fieldset class="cpf__section cpf__section--required">
      <legend class="cpf__legend">
        Medidas con cinta métrica <span class="cpf__required-tag">Obligatorio</span>
      </legend>
      <p class="cpf__hint">Mide sobre la piel, sin apretar la cinta, siempre en el mismo punto.</p>
      <div class="cpf__grid">
        <label v-for="metric in MEDIDAS" :key="metric.key" class="cpf__field">
          <span class="cpf__label">{{ metric.label }} <span class="cpf__star">*</span></span>
          <span class="cpf__input-wrap">
            <input
              :id="`cpf-${metric.group}-${metric.key}`"
              v-model="values[fieldKey(metric.group, metric.key)]"
              type="number"
              min="0"
              step="0.1"
              inputmode="decimal"
              class="cpf__input"
              :class="{ 'cpf__input--missing': showMissing(metric.group, metric.key) }"
              :aria-invalid="showMissing(metric.group, metric.key)"
              required
              placeholder="0"
            />
            <span class="cpf__unit">{{ metric.unit }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <fieldset class="cpf__section">
      <legend class="cpf__legend">
        Fotos de progreso <span class="cpf__optional-tag">Opcional</span>
      </legend>
      <p class="cpf__hint">
        <i class="fa-solid fa-lock" /> Son privadas: solo las ves tú y tu entrenadora. Con la misma
        ropa y luz cada mes, el cambio se nota muchísimo.
      </p>
      <div class="cpf__photos">
        <div v-for="slot in PHOTO_POSES" :key="slot.pose" class="cpf__photo">
          <template v-if="photos[slot.pose]">
            <img :src="photos[slot.pose]?.url" :alt="`Foto ${slot.label.toLowerCase()}`" class="cpf__photo-img" />
            <button
              type="button"
              class="cpf__photo-remove"
              :aria-label="`Quitar foto ${slot.label.toLowerCase()}`"
              @click="removePhoto(slot.pose)"
            >
              <i class="fa-solid fa-xmark" />
            </button>
            <span class="cpf__photo-label">{{ slot.label }}</span>
          </template>
          <label v-else class="cpf__photo-empty" :class="{ 'is-loading': uploadingPose === slot.pose }">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="cpf__photo-input"
              :disabled="uploadingPose !== null"
              @change="onPhotoSelected(slot.pose, $event)"
            />
            <i
              class="fa-solid"
              :class="uploadingPose === slot.pose ? 'fa-spinner fa-spin' : 'fa-camera'"
            />
            <strong>{{ slot.label }}</strong>
            <span>{{ uploadingPose === slot.pose ? 'Subiendo…' : slot.hint }}</span>
          </label>
        </div>
      </div>
      <p v-if="photoError" class="cpf__error" role="alert">{{ photoError }}</p>
    </fieldset>

    <button
      class="cpf__toggle"
      type="button"
      :aria-expanded="showOptional"
      @click="showOptional = !showOptional"
    >
      <i class="fa-solid" :class="showOptional ? 'fa-chevron-up' : 'fa-chevron-down'" />
      <span>{{ showOptional ? 'Ocultar' : 'Agregar' }} % de grasa, músculo y pruebas físicas</span>
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

    <p v-if="triedSubmit && missingRequired.length" class="cpf__error" role="alert">
      <i class="fa-solid fa-circle-exclamation" />
      Te falta completar: {{ missingRequired.map((m) => m.label.toLowerCase()).join(', ') }}.
    </p>

    <footer class="cpf__actions">
      <button class="cpf__btn cpf__btn--ghost" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button
        class="cpf__btn cpf__btn--primary"
        type="submit"
        :disabled="saving || uploadingPose !== null"
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

.cpf__progress {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba($lpb-amber, 0.12);
  color: #92400e;
  font-family: $font-sans;
  font-size: 0.9rem;

  &--done {
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
  }
}

.cpf__section--required {
  border-top-color: rgba($lpb-green-deep, 0.2);
}

.cpf__required-tag,
.cpf__optional-tag {
  margin-left: 0.5rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: middle;
}

.cpf__required-tag {
  background: rgba($alert-error, 0.1);
  color: $alert-error;
}

.cpf__optional-tag {
  background: rgba($lpb-black, 0.06);
  color: $lpb-muted;
}

.cpf__star {
  color: $alert-error;
}

.cpf__hint {
  font-family: $font-sans;
  font-size: 0.82rem;
  color: $lpb-graphite;
  margin: -0.4rem 0 0.9rem;
  line-height: 1.5;
}

.cpf__input--missing {
  border-color: $alert-error;
  background: rgba($alert-error, 0.05);
}

.cpf__error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba($alert-error, 0.08);
  color: $alert-error;
  font-family: $font-sans;
  font-size: 0.88rem;
  line-height: 1.45;
}

.cpf__photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.cpf__photo {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 0.9rem;
  overflow: hidden;
  background: $lpb-cream;
}

.cpf__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cpf__photo-label {
  position: absolute;
  left: 0.5rem;
  bottom: 0.5rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba($lpb-black, 0.65);
  color: $lpb-white;
  font-family: $font-sans;
  font-size: 0.75rem;
  font-weight: 600;
}

.cpf__photo-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba($lpb-black, 0.65);
  color: $lpb-white;
  cursor: pointer;
}

.cpf__photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 100%;
  padding: 0.75rem;
  border: 1.5px dashed rgba($lpb-green-deep, 0.3);
  border-radius: 0.9rem;
  color: $lpb-green-deep;
  text-align: center;
  font-family: $font-sans;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  i {
    font-size: 1.4rem;
  }

  strong {
    font-size: 0.88rem;
  }

  span {
    font-size: 0.75rem;
    color: $lpb-muted;
  }

  &:hover,
  &:focus-within {
    background: rgba($lpb-green, 0.08);
    border-color: $lpb-green;
  }

  &.is-loading {
    cursor: progress;
  }
}

.cpf__photo-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
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
