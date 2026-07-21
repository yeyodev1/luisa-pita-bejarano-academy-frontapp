<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminContentService } from '@/services/adminContentService'
import type { RecordedClass } from '@/types'

// ── state ─────────────────────────────────────────────────────────────────────
const classes = ref<RecordedClass[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref<string | null>(null)
const error = ref('')
const success = ref('')

// ── form ──────────────────────────────────────────────────────────────────────
const showForm = ref(false)
const editingId = ref<string | null>(null)

const emptyForm = () => ({
  title: '',
  classDate: '',
  startsAt: '06:00',
  endsAt: '07:00',
  recordingUrl: '',
  notesUrl: '',
  status: 'published' as RecordedClass['status'],
})

const form = ref(emptyForm())

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Guayaquil',
  })
}

function toInputDate(iso: string) {
  // Returns "YYYY-MM-DD" in Ecuador time for <input type="date">
  const d = new Date(iso)
  return d.toLocaleDateString('sv-SE', { timeZone: 'America/Guayaquil' })
}

function fromInputDate(dateStr: string, time = '06:00'): string {
  // dateStr = "YYYY-MM-DD", combine with time to get UTC ISO
  const parts = time.split(':').map(Number)
  const h = parts[0] ?? 6
  const m = parts[1] ?? 0
  // Ecuador is UTC-5, so add 5h
  const utcMs = new Date(`${dateStr}T00:00:00-05:00`).getTime() + (h * 60 + m) * 60000
  return new Date(utcMs).toISOString()
}

function isValidUrl(url: string) {
  try { new URL(url); return true } catch { return false }
}

const isFormValid = computed(() =>
  form.value.title.trim().length > 0 &&
  form.value.classDate.trim().length > 0 &&
  form.value.recordingUrl.trim().length > 0 &&
  isValidUrl(form.value.recordingUrl.trim()),
)

// ── data ──────────────────────────────────────────────────────────────────────
async function fetchClasses() {
  loading.value = true
  error.value = ''
  try {
    const res = await adminContentService.listRecordedClasses()
    classes.value = res.data.data.classes
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || 'No se pudieron cargar las clases.'
  } finally {
    loading.value = false
  }
}

// ── form actions ──────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
  success.value = ''
  error.value = ''
}

function openEdit(cls: RecordedClass) {
  editingId.value = cls._id
  form.value = {
    title: cls.title,
    classDate: toInputDate(cls.classDate),
    startsAt: cls.startsAt,
    endsAt: cls.endsAt,
    recordingUrl: cls.recordingUrl,
    notesUrl: cls.notesUrl ?? '',
    status: cls.status ?? 'published',
  }
  showForm.value = true
  success.value = ''
  error.value = ''
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  form.value = emptyForm()
}

async function submitForm() {
  if (!isFormValid.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      title: form.value.title.trim(),
      classDate: fromInputDate(form.value.classDate, form.value.startsAt),
      startsAt: form.value.startsAt,
      endsAt: form.value.endsAt,
      recordingUrl: form.value.recordingUrl.trim(),
      notesUrl: form.value.notesUrl.trim(),
      status: form.value.status,
    }
    if (editingId.value) {
      await adminContentService.updateRecordedClass(editingId.value, payload)
      success.value = 'Clase actualizada correctamente.'
    } else {
      await adminContentService.createRecordedClass(payload as Parameters<typeof adminContentService.createRecordedClass>[0])
      success.value = 'Clase grabada registrada correctamente.'
    }
    showForm.value = false
    editingId.value = null
    form.value = emptyForm()
    await fetchClasses()
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || 'Ocurrió un error al guardar.'
  } finally {
    saving.value = false
  }
}

async function deleteClass(cls: RecordedClass) {
  if (!confirm(`¿Eliminar "${cls.title}"? Esta acción no se puede deshacer.`)) return
  deleting.value = cls._id
  try {
    await adminContentService.deleteRecordedClass(cls._id)
    success.value = 'Clase eliminada.'
    await fetchClasses()
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || 'No se pudo eliminar.'
  } finally {
    deleting.value = null
  }
}

onMounted(fetchClasses)
</script>

<template>
  <div class="rc-admin">
    <!-- Header -->
    <header class="rc-admin__header">
      <div class="rc-admin__header-copy">
        <span class="rc-admin__eyebrow">Contenido</span>
        <h1 class="rc-admin__title">Clases grabadas</h1>
        <p class="rc-admin__subtitle">
          Sube el enlace de la grabación de cada clase en vivo para que las miembros puedan revisarla cuando quieran.
        </p>
      </div>
      <button class="rc-admin__btn rc-admin__btn--primary" @click="openCreate">
        <i class="fa-solid fa-plus" />
        Nueva clase grabada
      </button>
    </header>

    <!-- Feedback -->
    <p v-if="error" class="rc-admin__alert rc-admin__alert--error">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </p>
    <p v-if="success && !showForm" class="rc-admin__alert rc-admin__alert--success">
      <i class="fa-solid fa-circle-check" /> {{ success }}
    </p>

    <!-- Form -->
    <transition name="rc-slide">
      <section v-if="showForm" class="rc-admin__form-panel" aria-label="Formulario de clase grabada">
        <div class="rc-form">
          <div class="rc-form__head">
            <h2>{{ editingId ? 'Editar clase grabada' : 'Nueva clase grabada' }}</h2>
            <button type="button" class="rc-form__close" aria-label="Cerrar" @click="cancelForm">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <form class="rc-form__body" novalidate @submit.prevent="submitForm">
            <!-- Título -->
            <div class="rc-form__field">
              <label for="rc-title" class="rc-form__label">
                Título de la clase <span class="rc-form__required">*</span>
              </label>
              <input
                id="rc-title"
                v-model="form.title"
                type="text"
                class="rc-form__input"
                placeholder="Ej. Clase de Luisa Pita Bejarano — Lunes 21 de julio"
                required
                autocomplete="off"
              />
            </div>

            <!-- Fecha y horario -->
            <div class="rc-form__row">
              <div class="rc-form__field">
                <label for="rc-date" class="rc-form__label">
                  Fecha de la clase <span class="rc-form__required">*</span>
                </label>
                <input
                  id="rc-date"
                  v-model="form.classDate"
                  type="date"
                  class="rc-form__input"
                  required
                />
              </div>
              <div class="rc-form__field">
                <label for="rc-starts" class="rc-form__label">Hora inicio</label>
                <input
                  id="rc-starts"
                  v-model="form.startsAt"
                  type="time"
                  class="rc-form__input"
                />
              </div>
              <div class="rc-form__field">
                <label for="rc-ends" class="rc-form__label">Hora fin</label>
                <input
                  id="rc-ends"
                  v-model="form.endsAt"
                  type="time"
                  class="rc-form__input"
                />
              </div>
            </div>

            <!-- Link grabación -->
            <div class="rc-form__field">
              <label for="rc-recording" class="rc-form__label">
                Enlace de grabación <span class="rc-form__required">*</span>
              </label>
              <div class="rc-form__input-wrapper">
                <i class="fa-solid fa-video rc-form__input-icon" />
                <input
                  id="rc-recording"
                  v-model="form.recordingUrl"
                  type="url"
                  class="rc-form__input rc-form__input--with-icon"
                  placeholder="https://drive.google.com/file/d/..."
                  required
                />
              </div>
              <span class="rc-form__hint">
                Google Drive, Google Meet, Vimeo u otro enlace de video.
              </span>
            </div>

            <!-- Link notas -->
            <div class="rc-form__field">
              <label for="rc-notes" class="rc-form__label">
                Notas de la reunión
                <span class="rc-form__optional">(opcional)</span>
              </label>
              <div class="rc-form__input-wrapper">
                <i class="fa-solid fa-file-lines rc-form__input-icon" />
                <input
                  id="rc-notes"
                  v-model="form.notesUrl"
                  type="url"
                  class="rc-form__input rc-form__input--with-icon"
                  placeholder="https://docs.google.com/document/d/..."
                />
              </div>
            </div>

            <!-- Estado -->
            <div class="rc-form__field">
              <label for="rc-status" class="rc-form__label">Estado</label>
              <select id="rc-status" v-model="form.status" class="rc-form__input rc-form__input--select">
                <option value="published">Publicada (visible para miembros)</option>
                <option value="draft">Borrador (solo visible para admin)</option>
                <option value="archived">Archivada</option>
              </select>
            </div>

            <!-- Actions -->
            <div class="rc-form__actions">
              <button type="button" class="rc-admin__btn rc-admin__btn--ghost" @click="cancelForm">
                Cancelar
              </button>
              <button
                type="submit"
                class="rc-admin__btn rc-admin__btn--primary"
                :disabled="!isFormValid || saving"
              >
                <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
                <i v-else class="fa-solid fa-floppy-disk" />
                {{ saving ? 'Guardando…' : editingId ? 'Actualizar clase' : 'Guardar clase' }}
              </button>
            </div>

            <p v-if="error" class="rc-admin__alert rc-admin__alert--error rc-form__error">
              <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
            </p>
          </form>
        </div>
      </section>
    </transition>

    <!-- Loading -->
    <div v-if="loading" class="rc-admin__loading">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando clases…
    </div>

    <!-- Empty -->
    <div v-else-if="!loading && classes.length === 0 && !showForm" class="rc-admin__empty">
      <i class="fa-solid fa-film" />
      <p>Aún no hay clases grabadas.</p>
      <button class="rc-admin__btn rc-admin__btn--primary" @click="openCreate">
        Subir primera clase
      </button>
    </div>

    <!-- Table -->
    <section v-else-if="classes.length > 0" class="rc-admin__table-section" aria-label="Lista de clases grabadas">
      <div class="rc-table-wrap">
        <table class="rc-table">
          <thead>
            <tr>
              <th>Clase</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Grabación</th>
              <th>Notas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cls in classes" :key="cls._id">
              <td class="rc-table__title">{{ cls.title }}</td>
              <td class="rc-table__date">{{ formatDate(cls.classDate) }}</td>
              <td class="rc-table__time">{{ cls.startsAt }} – {{ cls.endsAt }}</td>
              <td>
                <a
                  :href="cls.recordingUrl"
                  target="_blank"
                  rel="noopener"
                  class="rc-table__link"
                  title="Abrir grabación"
                >
                  <i class="fa-solid fa-video" /> Ver
                </a>
              </td>
              <td>
                <a
                  v-if="cls.notesUrl"
                  :href="cls.notesUrl"
                  target="_blank"
                  rel="noopener"
                  class="rc-table__link rc-table__link--notes"
                  title="Abrir notas"
                >
                  <i class="fa-solid fa-file-lines" /> Notas
                </a>
                <span v-else class="rc-table__none">—</span>
              </td>
              <td>
                <span class="rc-table__badge" :class="`rc-table__badge--${cls.status}`">
                  {{ cls.status === 'published' ? 'Publicada' : cls.status === 'draft' ? 'Borrador' : 'Archivada' }}
                </span>
              </td>
              <td class="rc-table__actions">
                <button
                  class="rc-admin__btn rc-admin__btn--icon"
                  title="Editar"
                  @click="openEdit(cls)"
                >
                  <i class="fa-solid fa-pen" />
                </button>
                <button
                  class="rc-admin__btn rc-admin__btn--icon rc-admin__btn--danger"
                  title="Eliminar"
                  :disabled="deleting === cls._id"
                  @click="deleteClass(cls)"
                >
                  <i v-if="deleting === cls._id" class="fa-solid fa-spinner fa-spin" />
                  <i v-else class="fa-solid fa-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.rc-admin {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// ── Header ────────────────────────────────────────────────────────────────────
.rc-admin__header {
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

.rc-admin__header-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rc-admin__eyebrow {
  color: $lpb-green;
  font: 700 0.65rem $font-mono;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.rc-admin__title {
  margin: 0;
  font: 400 clamp(1.5rem, 4vw, 2.5rem) $font-display;
}

.rc-admin__subtitle {
  max-width: 60ch;
  margin: 0;
  font: 0.9rem/1.6 $font-sans;
  opacity: 0.8;
}

// ── Buttons ───────────────────────────────────────────────────────────────────
.rc-admin__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  font: 700 0.72rem $font-mono;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.18s, opacity 0.18s;

  &--primary {
    color: $lpb-black;
    background: $lpb-green;
    &:hover { background: darken(#8eae8c, 8%); }
  }

  &--ghost {
    color: $lpb-black;
    background: transparent;
    border: 1.5px solid rgba($lpb-green-deep, 0.35);
    &:hover { background: rgba($lpb-green-deep, 0.06); }
  }

  &--icon {
    padding: 0.5rem 0.7rem;
    border-radius: 0.65rem;
    background: rgba($lpb-green-deep, 0.08);
    color: $lpb-green-deep;
    &:hover { background: rgba($lpb-green-deep, 0.16); }
  }

  &--danger { color: #c0392b; background: rgba(#c0392b, 0.08); &:hover { background: rgba(#c0392b, 0.16); } }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ── Alerts ────────────────────────────────────────────────────────────────────
.rc-admin__alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.8rem;
  font: 0.85rem $font-sans;

  &--error  { color: $alert-error; background: $alert-error-bg; }
  &--success { color: #1a6640; background: #d4edda; }
}

// ── Form panel ────────────────────────────────────────────────────────────────
.rc-admin__form-panel {
  padding: 1.5rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.18);
  border-radius: 1.5rem;
}

.rc-form__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  h2 { margin: 0; color: $lpb-black; font: 400 1.35rem $font-display; }
}

.rc-form__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba($lpb-green-deep, 0.1);
  color: $lpb-green-deep;
  font-size: 1rem;
  transition: background 0.15s;
  &:hover { background: rgba($lpb-green-deep, 0.2); }
}

.rc-form__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rc-form__row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  .rc-form__field { flex: 1 1 140px; }
}

.rc-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.rc-form__label {
  color: $lpb-black;
  font: 700 0.78rem $font-mono;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rc-form__required { color: #c0392b; }
.rc-form__optional { color: $lpb-green-deep; font: 0.7rem $font-sans; text-transform: none; }

.rc-form__input {
  padding: 0.7rem 0.9rem;
  border: 1.5px solid rgba($lpb-green-deep, 0.25);
  border-radius: 0.75rem;
  background: $lpb-white;
  color: $lpb-black;
  font: 0.9rem $font-sans;
  transition: border-color 0.15s;

  &:focus { outline: none; border-color: $lpb-green; }
  &--select { cursor: pointer; }
  &--with-icon { padding-left: 2.5rem; }
}

.rc-form__input-wrapper { position: relative; }
.rc-form__input-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: $lpb-green-deep;
  opacity: 0.6;
  font-size: 0.85rem;
}

.rc-form__hint {
  color: $lpb-green-deep;
  font: 0.75rem $font-sans;
  opacity: 0.8;
}

.rc-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid rgba($lpb-green-deep, 0.12);
}

.rc-form__error { margin-top: 0.5rem; }

// ── Loading / Empty ───────────────────────────────────────────────────────────
.rc-admin__loading,
.rc-admin__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: $lpb-green-deep;
  background: $lpb-white;
  border: 1px dashed rgba($lpb-green-deep, 0.25);
  border-radius: 1.25rem;
  font: 0.9rem $font-sans;
  text-align: center;

  i { font-size: 2rem; opacity: 0.5; }
}

// ── Table ─────────────────────────────────────────────────────────────────────
.rc-admin__table-section { overflow: hidden; border-radius: 1.25rem; border: 1px solid rgba($lpb-green-deep, 0.18); }

.rc-table-wrap { overflow-x: auto; }

.rc-table {
  width: 100%;
  border-collapse: collapse;
  font: 0.85rem $font-sans;
  background: $lpb-white;

  th {
    padding: 0.9rem 1rem;
    background: rgba($lpb-green-deep, 0.06);
    color: $lpb-green-deep;
    font: 700 0.68rem $font-mono;
    letter-spacing: 0.08em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
    border-bottom: 1px solid rgba($lpb-green-deep, 0.12);
  }

  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba($lpb-green-deep, 0.08);
    vertical-align: middle;
    color: $lpb-black;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba($lpb-green, 0.04); }
}

.rc-table__title { font-weight: 600; max-width: 280px; }
.rc-table__date { white-space: nowrap; font-size: 0.82rem; }
.rc-table__time { white-space: nowrap; }
.rc-table__none { color: rgba($lpb-black, 0.3); }

.rc-table__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: $lpb-green-deep;
  font-weight: 600;
  text-decoration: underline;
  white-space: nowrap;
  &--notes { color: #8b6914; }
  &:hover { opacity: 0.7; }
}

.rc-table__badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font: 700 0.65rem $font-mono;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;

  &--published { color: #1a6640; background: #d4edda; }
  &--draft     { color: #7d6608; background: #fff3cd; }
  &--archived  { color: #495057; background: #e9ecef; }
}

.rc-table__actions { display: flex; gap: 0.4rem; }

// ── Transition ────────────────────────────────────────────────────────────────
.rc-slide-enter-active,
.rc-slide-leave-active { transition: opacity 0.2s, transform 0.22s; }
.rc-slide-enter-from,
.rc-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
