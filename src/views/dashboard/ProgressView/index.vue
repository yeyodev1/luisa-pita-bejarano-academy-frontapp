<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { contentService } from '@/services/contentService'
import type {
  AssessmentCheckpoint,
  CheckpointPayload,
  PhysicalAssessment,
  ProfilePayload,
} from '@/types/assessment'
import { sortedCheckpoints } from '@/utils/assessmentMetrics'
import AssessmentProfileForm from '@/components/assessment/AssessmentProfileForm.vue'
import CheckpointForm from '@/components/assessment/CheckpointForm.vue'
import AssessmentComparisonTable from '@/components/assessment/AssessmentComparisonTable.vue'

const assessment = ref<PhysicalAssessment | null>(null)
const loading = ref(true)
const savingProfile = ref(false)
const savingCheckpoint = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const showProfile = ref(false)
const editingCheckpoint = ref<AssessmentCheckpoint | null>(null)

const checkpoints = computed(() => sortedCheckpoints(assessment.value))

const suggestedMonthIndex = computed(
  () => (checkpoints.value[checkpoints.value.length - 1]?.monthIndex ?? -1) + 1,
)

function flash(message: string) {
  success.value = message
  setTimeout(() => (success.value = ''), 3500)
}

function handleError(err: unknown) {
  error.value = (err as { message?: string })?.message || 'Ocurrió un error. Intenta de nuevo.'
  setTimeout(() => (error.value = ''), 5000)
}

async function fetchAssessment() {
  loading.value = true
  try {
    const res = await contentService.getMyAssessment()
    assessment.value = res.data.data
    showProfile.value = !assessment.value?.profile?.estaturaCm
  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}

async function saveProfile(payload: ProfilePayload) {
  savingProfile.value = true
  try {
    const res = await contentService.saveMyAssessmentProfile(payload)
    assessment.value = res.data.data
    flash('Tus datos se guardaron')
    showProfile.value = false
  } catch (err) {
    handleError(err)
  } finally {
    savingProfile.value = false
  }
}

function openCreate() {
  editingCheckpoint.value = null
  showForm.value = true
}

function openEdit(checkpoint: AssessmentCheckpoint) {
  editingCheckpoint.value = checkpoint
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingCheckpoint.value = null
}

async function submitCheckpoint(payload: CheckpointPayload) {
  savingCheckpoint.value = true
  try {
    const res = editingCheckpoint.value
      ? await contentService.updateMyAssessmentCheckpoint(editingCheckpoint.value._id, payload)
      : await contentService.addMyAssessmentCheckpoint(payload)
    assessment.value = res.data.data
    flash(editingCheckpoint.value ? 'Registro actualizado' : 'Registro guardado')
    cancelForm()
  } catch (err) {
    handleError(err)
  } finally {
    savingCheckpoint.value = false
  }
}

const route = useRoute()

onMounted(async () => {
  await fetchAssessment()
  if (route.query.registrar === '1') openCreate()
})
</script>

<template>
  <div class="mpv">
    <header class="mpv__hero">
      <div class="mpv__hero-text">
        <p class="mpv__kicker">Tu transformación</p>
        <h1 class="mpv__title">Mi progreso</h1>
        <p class="mpv__subtitle">
          Registra tus medidas y pruebas físicas cada mes y mira cuánto has avanzado.
        </p>
      </div>
      <div class="mpv__hero-actions">
        <button class="mpv__btn mpv__btn--ghost" type="button" @click="showProfile = !showProfile">
          <i class="fa-solid fa-user-pen" />
          Mis datos
        </button>
        <button class="mpv__btn" type="button" @click="openCreate">
          <i class="fa-solid fa-plus" />
          Nuevo registro
        </button>
      </div>
    </header>

    <transition name="mpv-fade">
      <p v-if="error" class="mpv__alert mpv__alert--error">{{ error }}</p>
    </transition>
    <transition name="mpv-fade">
      <p v-if="success" class="mpv__alert mpv__alert--success">{{ success }}</p>
    </transition>

    <div v-if="loading" class="mpv__loading">
      <i class="fa-solid fa-spinner fa-spin" />
      Cargando tu progreso…
    </div>

    <template v-else>
      <transition name="mpv-slide">
        <section v-if="showProfile" class="mpv__card">
          <h2 class="mpv__card-title">Mis datos</h2>
          <p class="mpv__card-hint">
            Tu estatura se usa para calcular el IMC automáticamente en cada registro.
          </p>
          <AssessmentProfileForm
            :profile="assessment?.profile ?? null"
            :saving="savingProfile"
            @save="saveProfile"
          />
        </section>
      </transition>

      <transition name="mpv-slide">
        <CheckpointForm
          v-if="showForm"
          :checkpoint="editingCheckpoint"
          :suggested-month-index="suggestedMonthIndex"
          :saving="savingCheckpoint"
          @submit="submitCheckpoint"
          @cancel="cancelForm"
        />
      </transition>

      <section v-if="assessment && checkpoints.length" class="mpv__card">
        <h2 class="mpv__card-title">Comparativa mensual</h2>
        <AssessmentComparisonTable :assessment="assessment" editable @edit="openEdit" />
      </section>

      <div v-else-if="!showForm" class="mpv__empty">
        <div class="mpv__empty-icon">
          <i class="fa-solid fa-weight-scale" />
        </div>
        <h3 class="mpv__empty-title">Aún no tienes registros</h3>
        <p class="mpv__empty-text">
          Empieza con tu evaluación inicial: peso, medidas y pruebas físicas. Cada mes verás tu
          progreso aquí.
        </p>
        <button class="mpv__btn" type="button" @click="openCreate">
          <i class="fa-solid fa-plus" />
          Registrar mi evaluación inicial
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.mpv {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mpv__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 1.75rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  color: $lpb-white;
}

.mpv__hero-text {
  flex: 1 1 320px;
}

.mpv__kicker {
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green;
  margin: 0 0 0.3rem;
}

.mpv__title {
  font-family: $font-display;
  font-size: 2rem;
  margin: 0 0 0.4rem;
}

.mpv__subtitle {
  font-family: $font-sans;
  font-size: 0.92rem;
  color: rgba($lpb-white, 0.8);
  margin: 0;
  max-width: 480px;
}

.mpv__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.mpv__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  background: $lpb-green;
  color: $lpb-black;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: lighten($lpb-green, 8%);
  }

  &--ghost {
    background: rgba($lpb-white, 0.12);
    color: $lpb-white;

    &:hover {
      background: rgba($lpb-white, 0.25);
    }
  }
}

.mpv__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-family: $font-sans;
  font-size: 0.85rem;
  margin: 0;

  &--error {
    background: $alert-error-bg;
    color: $alert-error;
  }

  &--success {
    background: $alert-success-bg;
    color: $alert-success;
  }
}

.mpv__loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem;
  font-family: $font-sans;
  color: $lpb-muted;
}

.mpv__card {
  padding: 1.5rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mpv__card-title {
  font-family: $font-display;
  font-size: 1.15rem;
  color: $lpb-black;
  margin: 0;
}

.mpv__card-hint {
  font-family: $font-sans;
  font-size: 0.82rem;
  color: $lpb-muted;
  margin: -0.5rem 0 0;
}

.mpv__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  background: $lpb-white;
  border: 1px dashed rgba($lpb-green-deep, 0.25);
  border-radius: 1rem;
  text-align: center;
}

.mpv__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba($lpb-green, 0.12);
  color: $lpb-green-deep;
  font-size: 1.4rem;
}

.mpv__empty-title {
  font-family: $font-display;
  font-size: 1.2rem;
  color: $lpb-black;
  margin: 0;
}

.mpv__empty-text {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-muted;
  margin: 0;
  max-width: 440px;
}

.mpv-fade-enter-active,
.mpv-fade-leave-active {
  transition: opacity 0.25s ease;
}

.mpv-fade-enter-from,
.mpv-fade-leave-to {
  opacity: 0;
}

.mpv-slide-enter-active,
.mpv-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.mpv-slide-enter-from,
.mpv-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
