<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminContentService } from '@/services/adminContentService'
import type {
  AssessmentCheckpoint,
  CheckpointPayload,
  PhysicalAssessment,
  ProfilePayload,
} from '@/types/assessment'
import { checkpointLabel, sortedCheckpoints } from '@/utils/assessmentMetrics'
import AssessmentProfileForm from '@/components/assessment/AssessmentProfileForm.vue'
import CheckpointForm from '@/components/assessment/CheckpointForm.vue'
import AssessmentComparisonTable from '@/components/assessment/AssessmentComparisonTable.vue'

const route = useRoute()
const router = useRouter()

const userId = computed(() => String(route.params.userId))

const assessment = ref<PhysicalAssessment | null>(null)
const loading = ref(true)
const savingProfile = ref(false)
const savingCheckpoint = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const editingCheckpoint = ref<AssessmentCheckpoint | null>(null)

const studentName = computed(() => {
  const user = assessment.value?.user
  if (user && typeof user === 'object') {
    return `${user.name} ${user.lastName ?? ''}`.trim()
  }
  return String(route.query.name ?? 'Alumna')
})

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
    const res = await adminContentService.getAssessment(userId.value)
    assessment.value = res.data.data
  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}

async function saveProfile(payload: ProfilePayload) {
  savingProfile.value = true
  try {
    const res = await adminContentService.saveAssessmentProfile(userId.value, payload)
    assessment.value = res.data.data
    flash('Datos de la alumna guardados')
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
      ? await adminContentService.updateAssessmentCheckpoint(
          userId.value,
          editingCheckpoint.value._id,
          payload,
        )
      : await adminContentService.addAssessmentCheckpoint(userId.value, payload)
    assessment.value = res.data.data
    flash(editingCheckpoint.value ? 'Registro actualizado' : 'Registro creado')
    cancelForm()
  } catch (err) {
    handleError(err)
  } finally {
    savingCheckpoint.value = false
  }
}

async function deleteCheckpoint(checkpoint: AssessmentCheckpoint) {
  if (!confirm(`¿Eliminar el registro "${checkpointLabel(checkpoint.monthIndex)}"?`)) return
  try {
    const res = await adminContentService.deleteAssessmentCheckpoint(userId.value, checkpoint._id)
    assessment.value = res.data.data
    flash('Registro eliminado')
  } catch (err) {
    handleError(err)
  }
}

function goBack() {
  router.push({ name: 'admin-users' })
}

onMounted(fetchAssessment)
</script>

<template>
  <div class="aav">
    <header class="aav__header">
      <button class="aav__back" type="button" @click="goBack">
        <i class="fa-solid fa-arrow-left" />
        Usuarios
      </button>
      <div class="aav__heading">
        <p class="aav__kicker">Valoración física</p>
        <h1 class="aav__title">{{ studentName }}</h1>
      </div>
      <button class="aav__add" type="button" @click="openCreate">
        <i class="fa-solid fa-plus" />
        Nuevo registro
      </button>
    </header>

    <transition name="aav-fade">
      <p v-if="error" class="aav__alert aav__alert--error">{{ error }}</p>
    </transition>
    <transition name="aav-fade">
      <p v-if="success" class="aav__alert aav__alert--success">{{ success }}</p>
    </transition>

    <div v-if="loading" class="aav__loading">
      <i class="fa-solid fa-spinner fa-spin" />
      Cargando valoración…
    </div>

    <template v-else>
      <section class="aav__card">
        <h2 class="aav__card-title">Datos de la alumna</h2>
        <AssessmentProfileForm
          :profile="assessment?.profile ?? null"
          :saving="savingProfile"
          @save="saveProfile"
        />
      </section>

      <transition name="aav-slide">
        <CheckpointForm
          v-if="showForm"
          :checkpoint="editingCheckpoint"
          :suggested-month-index="suggestedMonthIndex"
          :saving="savingCheckpoint"
          @submit="submitCheckpoint"
          @cancel="cancelForm"
        />
      </transition>

      <section v-if="assessment && checkpoints.length" class="aav__card">
        <h2 class="aav__card-title">Progreso mensual</h2>
        <AssessmentComparisonTable
          :assessment="assessment"
          editable
          deletable
          @edit="openEdit"
          @delete="deleteCheckpoint"
        />
      </section>

      <div v-else-if="!showForm" class="aav__empty">
        <div class="aav__empty-icon">
          <i class="fa-solid fa-weight-scale" />
        </div>
        <h3 class="aav__empty-title">Sin registros todavía</h3>
        <p class="aav__empty-text">
          Crea el registro inicial para empezar a medir el progreso de {{ studentName }}.
        </p>
        <button class="aav__add" type="button" @click="openCreate">
          <i class="fa-solid fa-plus" />
          Registrar evaluación inicial
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.aav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.aav__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  color: $lpb-white;
}

.aav__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba($lpb-white, 0.12);
  color: $lpb-white;
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($lpb-white, 0.25);
  }
}

.aav__heading {
  flex: 1 1 auto;
}

.aav__kicker {
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green;
  margin: 0 0 0.2rem;
}

.aav__title {
  font-family: $font-display;
  font-size: 1.6rem;
  margin: 0;
}

.aav__add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.3rem;
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
}

.aav__alert {
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

.aav__loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem;
  font-family: $font-sans;
  color: $lpb-muted;
}

.aav__card {
  padding: 1.5rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.aav__card-title {
  font-family: $font-display;
  font-size: 1.15rem;
  color: $lpb-black;
  margin: 0;
}

.aav__empty {
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

.aav__empty-icon {
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

.aav__empty-title {
  font-family: $font-display;
  font-size: 1.2rem;
  color: $lpb-black;
  margin: 0;
}

.aav__empty-text {
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-muted;
  margin: 0;
  max-width: 420px;
}

.aav-fade-enter-active,
.aav-fade-leave-active {
  transition: opacity 0.25s ease;
}

.aav-fade-enter-from,
.aav-fade-leave-to {
  opacity: 0;
}

.aav-slide-enter-active,
.aav-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.aav-slide-enter-from,
.aav-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
