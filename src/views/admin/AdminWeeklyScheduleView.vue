<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminContentService } from '@/services/adminContentService'
import type { WeeklySession } from '@/types'

const DAYS = [
  { value: 1, short: 'L', label: 'Lunes' },
  { value: 2, short: 'M', label: 'Martes' },
  { value: 3, short: 'X', label: 'Miércoles' },
  { value: 4, short: 'J', label: 'Jueves' },
  { value: 5, short: 'V', label: 'Viernes' },
  { value: 6, short: 'S', label: 'Sábado' },
  { value: 0, short: 'D', label: 'Domingo' },
]

const sessions = ref<WeeklySession[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingId = ref<string | null>(null)
const showForm = ref(false)

const emptyForm = () => ({
  title: '',
  days: [1, 2, 3, 4, 5] as number[],
  startTime: '06:00',
  endTime: '07:00',
  meetingUrl: '',
  meetingId: '',
  passcode: '',
  color: '#536d59',
  active: true,
  reminders: true,
  isMainClass: false,
})
const form = ref(emptyForm())

const isFormValid = computed(
  () =>
    form.value.title.trim().length > 0 &&
    form.value.days.length > 0 &&
    form.value.endTime > form.value.startTime &&
    /^https:\/\//.test(form.value.meetingUrl.trim()),
)

function formatTime(time: string) {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

function daysLabel(days: number[]) {
  const sorted = DAYS.filter((d) => days.includes(d.value))
  if (sorted.length === 7) return 'Todos los días'
  if (sorted.length === 5 && !days.includes(0) && !days.includes(6)) return 'Lunes a viernes'
  return sorted.map((d) => d.label).join(', ')
}

function platform(url: string) {
  if (url.includes('zoom.us')) return 'Zoom'
  if (url.includes('meet.google.com')) return 'Google Meet'
  return 'Videollamada'
}

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err.response?.data?.message || err.message || fallback
}

async function fetchSessions() {
  loading.value = true
  error.value = ''
  try {
    const res = await adminContentService.listWeeklySchedule()
    sessions.value = res.data.data
  } catch (e) {
    error.value = messageOf(e, 'No se pudo cargar el horario.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
  success.value = ''
  error.value = ''
}

function openEdit(session: WeeklySession) {
  editingId.value = session._id
  form.value = {
    title: session.title,
    days: [...session.days],
    startTime: session.startTime,
    endTime: session.endTime,
    meetingUrl: session.meetingUrl,
    meetingId: session.meetingId,
    passcode: session.passcode,
    color: session.color,
    active: session.active,
    reminders: session.reminders,
    isMainClass: session.isMainClass,
  }
  showForm.value = true
  success.value = ''
  error.value = ''
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
}

function toggleDay(day: number) {
  const days = form.value.days
  form.value.days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
}

async function submitForm() {
  if (!isFormValid.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      ...form.value,
      title: form.value.title.trim(),
      meetingUrl: form.value.meetingUrl.trim(),
      meetingId: form.value.meetingId.trim(),
      passcode: form.value.passcode.trim(),
    }
    if (editingId.value) await adminContentService.updateWeeklySession(editingId.value, payload)
    else await adminContentService.createWeeklySession(payload)
    success.value = 'Horario guardado. Las alumnas ya ven el cambio y los recordatorios usarán estos datos.'
    showForm.value = false
    editingId.value = null
    await fetchSessions()
  } catch (e) {
    error.value = messageOf(e, 'No se pudo guardar.')
  } finally {
    saving.value = false
  }
}

async function removeSession(session: WeeklySession) {
  if (!confirm(`¿Eliminar "${session.title}" del horario? Dejarán de salir sus recordatorios.`)) return
  error.value = ''
  try {
    await adminContentService.deleteWeeklySession(session._id)
    success.value = 'Sesión eliminada del horario.'
    await fetchSessions()
  } catch (e) {
    error.value = messageOf(e, 'No se pudo eliminar.')
  }
}

onMounted(fetchSessions)
</script>

<template>
  <div class="ws-admin">
    <header class="ws-admin__header">
      <div>
        <span class="ws-admin__eyebrow">Contenido</span>
        <h1 class="ws-admin__title">Horario semanal</h1>
        <p class="ws-admin__subtitle">
          Las sesiones fijas de cada semana. Lo que cambies aquí (enlace, hora, días, ID o código)
          lo ven las alumnas en su calendario y sale en los recordatorios por correo
          1 hora, 30 y 10 minutos antes, y al empezar.
        </p>
      </div>
      <button type="button" class="ws-btn ws-btn--light" @click="openCreate">
        <i class="fa-solid fa-plus" /> Nueva sesión
      </button>
    </header>

    <p v-if="error" class="ws-alert ws-alert--error"><i class="fa-solid fa-triangle-exclamation" /> {{ error }}</p>
    <p v-if="success" class="ws-alert ws-alert--success"><i class="fa-solid fa-circle-check" /> {{ success }}</p>

    <form v-if="showForm" class="ws-form" novalidate @submit.prevent="submitForm">
      <div class="ws-form__head">
        <h2>{{ editingId ? 'Editar sesión' : 'Nueva sesión' }}</h2>
        <button type="button" class="ws-form__close" aria-label="Cerrar" @click="cancelForm">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <label class="ws-field">
        <span>Nombre <b>*</b></span>
        <input v-model="form.title" type="text" placeholder="Ej. Clase de Luisa Pita Bejarano" />
      </label>

      <fieldset class="ws-field">
        <legend>Días <b>*</b></legend>
        <div class="ws-days">
          <button
            v-for="day in DAYS"
            :key="day.value"
            type="button"
            class="ws-day"
            :class="{ 'ws-day--on': form.days.includes(day.value) }"
            :aria-pressed="form.days.includes(day.value)"
            :title="day.label"
            @click="toggleDay(day.value)"
          >
            {{ day.short }}
          </button>
        </div>
      </fieldset>

      <div class="ws-row">
        <label class="ws-field">
          <span>Hora de inicio (Ecuador) <b>*</b></span>
          <input v-model="form.startTime" type="time" />
        </label>
        <label class="ws-field">
          <span>Hora de fin <b>*</b></span>
          <input v-model="form.endTime" type="time" />
        </label>
      </div>
      <p v-if="form.endTime <= form.startTime" class="ws-hint ws-hint--error">La hora de fin debe ser después de la de inicio.</p>

      <label class="ws-field">
        <span>Enlace de la reunión (Zoom o Meet) <b>*</b></span>
        <input v-model="form.meetingUrl" type="url" placeholder="https://us06web.zoom.us/j/..." />
      </label>

      <div class="ws-row">
        <label class="ws-field">
          <span>ID de reunión <i>(opcional)</i></span>
          <input v-model="form.meetingId" type="text" placeholder="833 2285 3984" />
        </label>
        <label class="ws-field">
          <span>Código de acceso <i>(opcional)</i></span>
          <input v-model="form.passcode" type="text" placeholder="353621" />
        </label>
      </div>

      <div class="ws-checks">
        <label><input v-model="form.active" type="checkbox" /> <span><strong>Visible</strong><small>Aparece en el calendario de las alumnas.</small></span></label>
        <label><input v-model="form.reminders" type="checkbox" /> <span><strong>Recordatorios por correo</strong><small>1 hora, 30 y 10 minutos antes, y al empezar.</small></span></label>
        <label><input v-model="form.isMainClass" type="checkbox" /> <span><strong>Clase principal</strong><small>Sus grabaciones de Zoom se publican solas en Clases grabadas.</small></span></label>
      </div>

      <div class="ws-form__actions">
        <button type="button" class="ws-btn ws-btn--ghost" @click="cancelForm">Cancelar</button>
        <button type="submit" class="ws-btn ws-btn--primary" :disabled="!isFormValid || saving">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>

    <p v-if="loading" class="ws-empty">Cargando horario…</p>
    <p v-else-if="!sessions.length" class="ws-empty">No hay sesiones en el horario.</p>

    <div class="ws-list">
      <article v-for="session in sessions" :key="session._id" class="ws-card" :class="{ 'ws-card--off': !session.active }">
        <span class="ws-card__bar" :style="{ backgroundColor: session.color }" />
        <div class="ws-card__body">
          <span class="ws-card__days">{{ daysLabel(session.days) }}</span>
          <h3>{{ session.title }}</h3>
          <strong>{{ formatTime(session.startTime) }} - {{ formatTime(session.endTime) }}</strong>
          <a :href="session.meetingUrl" target="_blank" rel="noopener" class="ws-card__link">
            <i class="fa-solid fa-video" /> {{ platform(session.meetingUrl) }}
          </a>
          <small v-if="session.meetingId || session.passcode">
            <template v-if="session.meetingId">ID {{ session.meetingId }}</template>
            <template v-if="session.meetingId && session.passcode"> · </template>
            <template v-if="session.passcode">Código {{ session.passcode }}</template>
          </small>
          <div class="ws-card__tags">
            <span v-if="!session.active">Oculta</span>
            <span v-if="session.reminders">Recordatorios</span>
            <span v-if="session.isMainClass">Clase principal</span>
          </div>
        </div>
        <div class="ws-card__actions">
          <button type="button" class="ws-btn ws-btn--primary" @click="openEdit(session)">
            <i class="fa-solid fa-pen" /> Editar
          </button>
          <button type="button" class="ws-btn ws-btn--ghost" aria-label="Eliminar" @click="removeSession(session)">
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ws-admin {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ws-admin__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  border-radius: 1.5rem;
  color: $lpb-white;
}

.ws-admin__eyebrow {
  color: $lpb-green;
  font: 700 0.65rem $font-mono;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ws-admin__title {
  margin: 0.35rem 0;
  font-family: $font-display;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.ws-admin__subtitle {
  max-width: 44rem;
  margin: 0;
  color: rgba($lpb-white, 0.78);
  font: 400 0.9rem/1.5 $font-sans;
}

.ws-alert {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  font: 500 0.9rem $font-sans;

  &--error {
    background: $alert-error-bg;
    color: $alert-error;
  }

  &--success {
    background: $alert-success-bg;
    color: $alert-success;
  }
}

.ws-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.55rem 1.1rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font: 600 0.85rem $font-sans;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: $lpb-green-deep;
    color: $lpb-white;
  }

  &--light {
    background: $lpb-white;
    color: $lpb-green-deep;
  }

  &--ghost {
    background: transparent;
    border-color: $lpb-line;
    color: $lpb-ink;
  }
}

.ws-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1rem, 3vw, 1.75rem);
  background: $lpb-white;
  border: 1px solid $lpb-line;
  border-radius: 1.25rem;
}

.ws-form__head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font: 600 1.15rem $font-sans;
    color: $lpb-black;
  }
}

.ws-form__close {
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: $lpb-paper;
  cursor: pointer;
}

.ws-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  font: 600 0.85rem $font-sans;
  color: $lpb-ink;

  b {
    color: $alert-error;
  }

  i {
    font-style: normal;
    font-weight: 400;
    color: $lpb-muted;
  }

  input {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.6rem 0.85rem;
    border: 1px solid $lpb-line;
    border-radius: 0.75rem;
    background: $lpb-white;
    font: 400 0.95rem $font-sans;
    color: $lpb-black;

    &:focus {
      outline: 2px solid rgba($lpb-green-deep, 0.35);
      border-color: $lpb-green-deep;
    }
  }
}

.ws-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.ws-days {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ws-day {
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid $lpb-line;
  border-radius: 50%;
  background: $lpb-white;
  color: $lpb-ink;
  font: 700 0.9rem $font-sans;
  cursor: pointer;

  &--on {
    background: $lpb-green-deep;
    border-color: $lpb-green-deep;
    color: $lpb-white;
  }
}

.ws-hint {
  margin: -0.5rem 0 0;
  font: 400 0.8rem $font-sans;

  &--error {
    color: $alert-error;
  }
}

.ws-checks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.8rem 1rem;
    border: 1px solid rgba($lpb-green-deep, 0.2);
    border-radius: 0.75rem;
    background: rgba($lpb-green, 0.06);
    cursor: pointer;
  }

  input {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 0.15rem;
    accent-color: $lpb-green-deep;
  }

  span {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-family: $font-sans;
  }

  strong {
    font-size: 0.9rem;
    color: $lpb-black;
  }

  small {
    font-size: 0.8rem;
    color: $lpb-muted;
  }
}

.ws-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.ws-empty {
  margin: 0;
  color: $lpb-muted;
  font: 400 0.9rem $font-sans;
}

.ws-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
  gap: 1rem;
}

.ws-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1.25rem 1.6rem;
  overflow: hidden;
  background: $lpb-white;
  border: 1px solid $lpb-line;
  border-radius: 1.25rem;

  &--off {
    opacity: 0.6;
  }
}

.ws-card__bar {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.4rem;
}

.ws-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: $font-sans;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    color: $lpb-black;
  }

  strong {
    color: $lpb-green-deep;
  }

  small {
    color: $lpb-muted;
    font-size: 0.8rem;
  }
}

.ws-card__days {
  color: $lpb-muted;
  font: 700 0.7rem $font-mono;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ws-card__link {
  width: fit-content;
  color: $lpb-green-deep;
  font-size: 0.85rem;
  font-weight: 600;
}

.ws-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  span {
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: rgba($lpb-green, 0.14);
    color: $lpb-green-deep;
    font: 600 0.7rem $font-sans;
  }
}

.ws-card__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
