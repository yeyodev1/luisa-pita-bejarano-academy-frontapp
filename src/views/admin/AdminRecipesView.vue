<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminContentService } from '@/services/adminContentService'
import MediaUploader from '@/components/admin/MediaUploader.vue'
import type { MediaAsset, Recipe } from '@/types'

const recipes = ref<Recipe[]>([])
const loading = ref(false)
const saving = ref(false)
const busyId = ref<string | null>(null)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const editing = ref<Recipe | null>(null)
/** Tras el primer intento de guardar se marcan los obligatorios vacíos. */
const triedSubmit = ref(false)

const emptyForm = () => ({
  title: '',
  summary: '',
  description: '',
  ingredients: '',
  instructions: '',
  prepMinutes: '',
  cookMinutes: '',
  servings: '',
  status: 'published' as 'published' | 'draft',
  notify: true,
})

const form = ref(emptyForm())
const cover = ref<MediaAsset>()
const originalCover = ref<MediaAsset>()

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)

const ingredientList = computed(() => lines(form.value.ingredients))
const stepList = computed(() => lines(form.value.instructions))

const missing = computed(() => {
  const list: string[] = []
  if (!form.value.title.trim()) list.push('el nombre de la receta')
  if (!ingredientList.value.length) list.push('los ingredientes')
  if (!stepList.value.length) list.push('los pasos de preparación')
  return list
})

const alreadyAnnounced = computed(() => Boolean(editing.value?.announcedAt))
const willNotify = computed(
  () => form.value.status === 'published' && form.value.notify && !alreadyAnnounced.value,
)

const publishedCount = computed(() => recipes.value.filter((r) => r.status === 'published').length)

function statusLabel(status?: string) {
  if (status === 'published') return 'Publicada'
  if (status === 'archived') return 'Archivada'
  return 'Borrador'
}

function totalMinutes(recipe: Recipe) {
  return (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0)
}

async function fetchRecipes() {
  loading.value = true
  try {
    recipes.value = await adminContentService.list<Recipe>('recipes')
  } catch (e) {
    error.value = (e as { message?: string }).message || 'No se pudieron cargar las recetas.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  cover.value = undefined
  originalCover.value = undefined
  triedSubmit.value = false
  error.value = ''
  success.value = ''
  showForm.value = true
}

function openEdit(recipe: Recipe) {
  editing.value = recipe
  form.value = {
    title: recipe.title,
    summary: recipe.summary || '',
    description: recipe.description || '',
    ingredients: (recipe.ingredients || []).join('\n'),
    instructions: (recipe.instructions || []).join('\n'),
    prepMinutes: recipe.prepMinutes ? String(recipe.prepMinutes) : '',
    cookMinutes: recipe.cookMinutes ? String(recipe.cookMinutes) : '',
    servings: recipe.servings ? String(recipe.servings) : '',
    status: recipe.status === 'published' ? 'published' : 'draft',
    notify: false,
  }
  cover.value = recipe.cover
  originalCover.value = recipe.cover
  triedSubmit.value = false
  error.value = ''
  success.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function removeCover() {
  if (!cover.value) return
  // Solo se borra de Cloudinary si se subió en esta edición; la anterior se
  // limpia después de guardar para no dejar la receta sin foto si se cancela.
  if (cover.value.publicId !== originalCover.value?.publicId) {
    await adminContentService
      .deleteMedia(cover.value.publicId, cover.value.resourceType, cover.value.provider)
      .catch(() => undefined)
  }
  cover.value = undefined
}

function numberOrUndefined(value: string) {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined
}

async function save() {
  triedSubmit.value = true
  error.value = ''
  if (missing.value.length) {
    error.value = `Te falta completar ${missing.value.join(', ')}.`
    return
  }
  saving.value = true
  const notified = willNotify.value
  try {
    const servings = numberOrUndefined(form.value.servings)
    const payload: Record<string, unknown> = {
      title: form.value.title.trim(),
      summary: form.value.summary.trim(),
      description: form.value.description.trim(),
      ingredients: ingredientList.value,
      instructions: stepList.value,
      prepMinutes: numberOrUndefined(form.value.prepMinutes) ?? 0,
      cookMinutes: numberOrUndefined(form.value.cookMinutes) ?? 0,
      status: form.value.status,
      cover: cover.value ?? null,
      notify: notified,
    }
    if (servings && servings >= 1) payload.servings = servings

    const previous = originalCover.value
    if (editing.value) await adminContentService.update('recipes', editing.value._id, payload)
    else await adminContentService.create('recipes', payload)
    if (previous && previous.publicId !== cover.value?.publicId) {
      await adminContentService
        .deleteMedia(previous.publicId, previous.resourceType, previous.provider)
        .catch(() => undefined)
    }

    success.value =
      form.value.status === 'published'
        ? `"${payload.title}" está publicada: las alumnas ya la ven en Recetas.`
        : `"${payload.title}" quedó guardada como borrador. Las alumnas aún no la ven.`
    if (notified) success.value += ' Estamos enviando el correo a las alumnas activas.'
    closeForm()
    await fetchRecipes()
  } catch (e) {
    error.value = (e as { message?: string }).message || 'No se pudo guardar la receta.'
  } finally {
    saving.value = false
  }
}

async function publish(recipe: Recipe) {
  const notify =
    !recipe.announcedAt &&
    confirm(
      `¿Publicar "${recipe.title}" y avisar por correo a las alumnas activas?\n\nAceptar: publicar y enviar correo.\nCancelar: solo publicar, sin correo.`,
    )
  busyId.value = recipe._id
  error.value = ''
  try {
    await adminContentService.update('recipes', recipe._id, { status: 'published', notify })
    success.value = notify
      ? `"${recipe.title}" publicada. Estamos enviando el correo a las alumnas activas.`
      : `"${recipe.title}" publicada: las alumnas ya la ven.`
    await fetchRecipes()
  } catch (e) {
    error.value = (e as { message?: string }).message || 'No se pudo publicar.'
  } finally {
    busyId.value = null
  }
}

async function unpublish(recipe: Recipe) {
  if (!confirm(`¿Ocultar "${recipe.title}"? Las alumnas dejarán de verla.`)) return
  busyId.value = recipe._id
  error.value = ''
  try {
    await adminContentService.update('recipes', recipe._id, { status: 'draft' })
    success.value = `"${recipe.title}" ya no es visible para las alumnas.`
    await fetchRecipes()
  } catch (e) {
    error.value = (e as { message?: string }).message || 'No se pudo ocultar.'
  } finally {
    busyId.value = null
  }
}

async function remove(recipe: Recipe) {
  if (!confirm(`¿Eliminar "${recipe.title}"? Esta acción no se puede deshacer.`)) return
  busyId.value = recipe._id
  error.value = ''
  try {
    await adminContentService.remove('recipes', recipe._id)
    success.value = 'Receta eliminada.'
    await fetchRecipes()
  } catch (e) {
    error.value = (e as { message?: string }).message || 'No se pudo eliminar.'
  } finally {
    busyId.value = null
  }
}

onMounted(fetchRecipes)
</script>

<template>
  <div class="ar">
    <header class="ar__header">
      <div>
        <span class="ar__eyebrow">Contenido</span>
        <h1 class="ar__title">Recetas</h1>
        <p class="ar__subtitle">
          {{ recipes.length }} recetas · {{ publishedCount }} visibles para las alumnas
        </p>
      </div>
      <button v-if="!showForm" class="ar__btn ar__btn--primary" type="button" @click="openCreate">
        <i class="fa-solid fa-plus" /> Subir receta nueva
      </button>
    </header>

    <p v-if="error && !showForm" class="ar__alert ar__alert--error" role="alert">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </p>
    <p v-if="success && !showForm" class="ar__alert ar__alert--success" role="status">
      <i class="fa-solid fa-circle-check" /> {{ success }}
    </p>

    <!-- Formulario paso a paso -->
    <form v-if="showForm" class="ar__form" novalidate @submit.prevent="save">
      <div class="ar__form-head">
        <h2>{{ editing ? `Editar: ${editing.title}` : 'Subir receta nueva' }}</h2>
        <button type="button" class="ar__close" aria-label="Cerrar" @click="closeForm">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <section class="ar__step">
        <span class="ar__step-num">1</span>
        <div class="ar__step-body">
          <h3>Foto del plato <span class="ar__tag">Recomendado</span></h3>
          <p class="ar__hint">Una foto horizontal y bien iluminada. Es lo primero que ven las alumnas.</p>
          <div class="ar__cover">
            <div class="ar__cover-preview">
              <img v-if="cover?.deliveryUrl" :src="cover.deliveryUrl" alt="Foto de la receta" />
              <span v-else-if="cover" class="ar__cover-ok">
                <i class="fa-solid fa-circle-check" /> Foto cargada
              </span>
              <span v-else class="ar__cover-empty"><i class="fa-solid fa-image" /> Sin foto</span>
            </div>
            <div class="ar__cover-actions">
              <MediaUploader
                resource-type="image"
                category="recipes"
                :label="cover ? 'Cambiar foto' : 'Subir foto'"
                @uploaded="cover = $event"
              />
              <button v-if="cover" type="button" class="ar__link-danger" @click="removeCover">
                Quitar foto
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="ar__step">
        <span class="ar__step-num">2</span>
        <div class="ar__step-body">
          <h3>Nombre y datos</h3>
          <label class="ar__field">
            <span>Nombre de la receta <b>*</b></span>
            <input
              v-model="form.title"
              type="text"
              placeholder="Ej. Pancakes de avena y banano"
              :class="{ 'is-missing': triedSubmit && !form.title.trim() }"
            />
          </label>
          <label class="ar__field">
            <span>Descripción corta <em>(opcional)</em></span>
            <input
              v-model="form.summary"
              type="text"
              maxlength="160"
              placeholder="Ej. Desayuno alto en proteína, listo en 15 minutos"
            />
          </label>
          <div class="ar__row">
            <label class="ar__field">
              <span>Preparación (min)</span>
              <input v-model="form.prepMinutes" type="number" min="0" inputmode="numeric" placeholder="10" />
            </label>
            <label class="ar__field">
              <span>Cocción (min)</span>
              <input v-model="form.cookMinutes" type="number" min="0" inputmode="numeric" placeholder="5" />
            </label>
            <label class="ar__field">
              <span>Porciones</span>
              <input v-model="form.servings" type="number" min="1" inputmode="numeric" placeholder="2" />
            </label>
          </div>
        </div>
      </section>

      <section class="ar__step">
        <span class="ar__step-num">3</span>
        <div class="ar__step-body">
          <h3>Ingredientes <b>*</b></h3>
          <p class="ar__hint">
            Escribe <strong>un ingrediente por línea</strong> (pulsa Enter para el siguiente).
          </p>
          <textarea
            v-model="form.ingredients"
            rows="6"
            :placeholder="'1 taza de avena\n1 banano maduro\n2 claras de huevo'"
            :class="{ 'is-missing': triedSubmit && !ingredientList.length }"
          />
          <small class="ar__count">{{ ingredientList.length }} ingredientes</small>
        </div>
      </section>

      <section class="ar__step">
        <span class="ar__step-num">4</span>
        <div class="ar__step-body">
          <h3>Preparación <b>*</b></h3>
          <p class="ar__hint">
            Escribe <strong>un paso por línea</strong>, en orden. No hace falta numerarlos.
          </p>
          <textarea
            v-model="form.instructions"
            rows="6"
            :placeholder="'Licúa todos los ingredientes.\nCalienta un sartén antiadherente.\nCocina 2 minutos por lado.'"
            :class="{ 'is-missing': triedSubmit && !stepList.length }"
          />
          <small class="ar__count">{{ stepList.length }} pasos</small>
          <label class="ar__field">
            <span>Consejo o nota de Luisa <em>(opcional)</em></span>
            <textarea v-model="form.description" rows="3" placeholder="Ej. Puedes cambiar el banano por fresas." />
          </label>
        </div>
      </section>

      <section class="ar__step">
        <span class="ar__step-num">5</span>
        <div class="ar__step-body">
          <h3>¿La publicamos?</h3>
          <div class="ar__choices">
            <label class="ar__choice" :class="{ 'is-active': form.status === 'published' }">
              <input v-model="form.status" type="radio" value="published" />
              <span>
                <strong><i class="fa-solid fa-eye" /> Publicar ahora</strong>
                <small>Las alumnas la ven en Recetas apenas guardes.</small>
              </span>
            </label>
            <label class="ar__choice" :class="{ 'is-active': form.status === 'draft' }">
              <input v-model="form.status" type="radio" value="draft" />
              <span>
                <strong><i class="fa-solid fa-eye-slash" /> Guardar como borrador</strong>
                <small>Solo la ves tú. La publicas cuando quieras.</small>
              </span>
            </label>
          </div>

          <template v-if="form.status === 'published'">
            <p v-if="alreadyAnnounced" class="ar__hint">
              <i class="fa-solid fa-envelope-circle-check" /> Ya se avisó por correo de esta receta.
            </p>
            <label v-else class="ar__notify">
              <input v-model="form.notify" type="checkbox" />
              <span>
                <strong>Avisar por correo a las alumnas activas</strong>
                <small>Les llega un correo con la receta nueva. Se envía una sola vez.</small>
              </span>
            </label>
          </template>
        </div>
      </section>

      <p v-if="error" class="ar__alert ar__alert--error" role="alert">
        <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
      </p>

      <div class="ar__actions">
        <button type="button" class="ar__btn ar__btn--ghost" @click="closeForm">Cancelar</button>
        <button type="submit" class="ar__btn ar__btn--primary" :disabled="saving">
          <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'" />
          {{
            saving
              ? 'Guardando…'
              : form.status === 'published'
                ? willNotify
                  ? 'Publicar y avisar por correo'
                  : 'Guardar y publicar'
                : 'Guardar borrador'
          }}
        </button>
      </div>
    </form>

    <!-- Lista -->
    <div v-if="loading && !recipes.length" class="ar__empty">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando recetas…
    </div>

    <div v-else-if="!recipes.length && !showForm" class="ar__empty">
      <i class="fa-solid fa-utensils" />
      <p>Aún no hay recetas. Sube la primera: foto, ingredientes y pasos.</p>
      <button class="ar__btn ar__btn--primary" type="button" @click="openCreate">
        <i class="fa-solid fa-plus" /> Subir primera receta
      </button>
    </div>

    <ul v-else-if="!showForm" class="ar__list">
      <li v-for="recipe in recipes" :key="recipe._id" class="ar__item">
        <div class="ar__thumb">
          <img v-if="recipe.cover?.deliveryUrl" :src="recipe.cover.deliveryUrl" :alt="recipe.title" loading="lazy" />
          <i v-else class="fa-solid fa-utensils" />
        </div>
        <div class="ar__item-info">
          <strong>{{ recipe.title }}</strong>
          <small>
            {{ recipe.ingredients?.length || 0 }} ingredientes · {{ recipe.instructions?.length || 0 }} pasos
            <template v-if="totalMinutes(recipe)"> · {{ totalMinutes(recipe) }} min</template>
          </small>
          <span class="ar__badge" :class="`ar__badge--${recipe.status || 'draft'}`">
            {{ statusLabel(recipe.status) }}
            <template v-if="recipe.status !== 'published'"> · las alumnas no la ven</template>
          </span>
        </div>
        <div class="ar__item-actions">
          <button
            v-if="recipe.status !== 'published'"
            type="button"
            class="ar__btn ar__btn--publish"
            :disabled="busyId === recipe._id"
            @click="publish(recipe)"
          >
            <i class="fa-solid fa-paper-plane" /> Publicar
          </button>
          <button
            v-else
            type="button"
            class="ar__btn ar__btn--ghost"
            :disabled="busyId === recipe._id"
            @click="unpublish(recipe)"
          >
            <i class="fa-solid fa-eye-slash" /> Ocultar
          </button>
          <button type="button" class="ar__btn ar__btn--ghost" @click="openEdit(recipe)">
            <i class="fa-solid fa-pen" /> Editar
          </button>
          <button
            type="button"
            class="ar__btn ar__btn--icon"
            title="Eliminar"
            aria-label="Eliminar receta"
            :disabled="busyId === recipe._id"
            @click="remove(recipe)"
          >
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.ar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.ar__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.ar__eyebrow {
  font: 600 0.65rem $font-mono;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green-deep;
}

.ar__title {
  font: 400 2rem $font-display;
  margin: 0.2rem 0;
  color: $lpb-black;
}

.ar__subtitle {
  margin: 0;
  font: 0.9rem $font-sans;
  color: $lpb-muted;
}

.ar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font: 600 0.85rem $font-sans;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: $lpb-green-deep;
    color: $lpb-white;

    &:hover:not(:disabled) {
      background: $lpb-green-dark;
    }
  }

  &--ghost {
    background: $lpb-white;
    border-color: rgba($lpb-green-deep, 0.22);
    color: $lpb-graphite;

    &:hover:not(:disabled) {
      background: rgba($lpb-green-deep, 0.06);
    }
  }

  &--publish {
    background: rgba($lpb-green, 0.15);
    color: $lpb-green-deep;

    &:hover:not(:disabled) {
      background: rgba($lpb-green, 0.25);
    }
  }

  &--icon {
    width: 2.5rem;
    padding: 0.7rem 0;
    background: rgba($alert-error, 0.08);
    color: $alert-error;
  }
}

.ar__alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  font: 0.9rem/1.45 $font-sans;

  &--error {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
  }

  &--success {
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
  }
}

.ar__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.75rem;
  border: 1px solid rgba($lpb-green-deep, 0.15);
  border-radius: 1.25rem;
  background: $lpb-white;
}

.ar__form-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  h2 {
    margin: 0;
    font: 400 1.5rem $font-display;
    color: $lpb-black;
  }
}

.ar__close {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 999px;
  background: rgba($lpb-black, 0.05);
  cursor: pointer;
}

.ar__step {
  display: flex;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba($lpb-green-deep, 0.12);
}

.ar__step-num {
  flex: 0 0 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: $lpb-green-deep;
  color: $lpb-white;
  font: 700 0.9rem $font-sans;
}

.ar__step-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h3 {
    margin: 0.25rem 0 0;
    font: 700 1rem $font-sans;
    color: $lpb-black;

    b {
      color: $alert-error;
    }
  }

  input[type='text'],
  input[type='number'],
  textarea {
    width: 100%;
    padding: 0.8rem 0.95rem;
    border: 1px solid rgba($lpb-green-deep, 0.2);
    border-radius: 0.75rem;
    background: $lpb-cream;
    font: 0.95rem/1.5 $font-sans;
    color: $lpb-black;

    &:focus {
      outline: none;
      border-color: $lpb-green;
      background: $lpb-white;
      box-shadow: 0 0 0 3px rgba($lpb-green, 0.15);
    }

    &.is-missing {
      border-color: $alert-error;
      background: rgba($alert-error, 0.05);
    }
  }

  textarea {
    resize: vertical;
  }
}

.ar__tag {
  margin-left: 0.4rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba($lpb-black, 0.06);
  color: $lpb-muted;
  font: 600 0.62rem $font-mono;
  text-transform: uppercase;
  vertical-align: middle;
}

.ar__hint {
  margin: 0;
  font: 0.85rem/1.5 $font-sans;
  color: $lpb-graphite;
}

.ar__count {
  margin-top: -0.4rem;
  font: 0.75rem $font-mono;
  color: $lpb-muted;
}

.ar__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 140px;

  > span {
    font: 600 0.85rem $font-sans;
    color: $lpb-ink;

    b {
      color: $alert-error;
    }

    em {
      font-weight: 400;
      color: $lpb-muted;
    }
  }
}

.ar__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.ar__cover {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.ar__cover-preview {
  width: 220px;
  max-width: 100%;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0.9rem;
  background: $lpb-cream;
  border: 1px dashed rgba($lpb-green-deep, 0.25);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.ar__cover-empty,
.ar__cover-ok {
  font: 0.85rem $font-sans;
  color: $lpb-muted;
}

.ar__cover-ok {
  color: $lpb-green-deep;
}

.ar__cover-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.ar__link-danger {
  border: none;
  background: none;
  padding: 0;
  color: $alert-error;
  font: 600 0.85rem $font-sans;
  cursor: pointer;
}

.ar__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.ar__choice,
.ar__notify {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 0.85rem;
  cursor: pointer;

  input {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 0.15rem;
    accent-color: $lpb-green-deep;
  }

  span {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-family: $font-sans;
  }

  strong {
    font-size: 0.92rem;
    color: $lpb-black;
  }

  small {
    font-size: 0.8rem;
    color: $lpb-muted;
  }
}

.ar__choice.is-active {
  border-color: $lpb-green-deep;
  background: rgba($lpb-green, 0.08);
}

.ar__notify {
  background: rgba($lpb-green, 0.06);
}

.ar__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.ar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  border: 1px dashed rgba($lpb-green-deep, 0.25);
  border-radius: 1.25rem;
  text-align: center;
  font: 0.95rem $font-sans;
  color: $lpb-graphite;

  > i {
    font-size: 1.75rem;
    color: $lpb-green-deep;
  }

  p {
    margin: 0;
  }
}

.ar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ar__item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  background: $lpb-white;
}

.ar__thumb {
  flex: 0 0 88px;
  height: 66px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0.65rem;
  background: rgba($lpb-green, 0.1);
  color: $lpb-green-deep;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.ar__item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;

  strong {
    font: 600 0.98rem $font-sans;
    color: $lpb-black;
  }

  small {
    font: 0.78rem $font-sans;
    color: $lpb-muted;
  }
}

.ar__badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font: 600 0.7rem $font-sans;

  &--published {
    background: rgba($lpb-green, 0.14);
    color: $lpb-green-deep;
  }

  &--draft,
  &--archived {
    background: rgba($lpb-amber, 0.14);
    color: #92400e;
  }
}

.ar__item-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
}

@media (max-width: 720px) {
  .ar__form {
    padding: 1.25rem 1rem;
  }

  .ar__step {
    gap: 0.75rem;
  }

  .ar__item {
    flex-wrap: wrap;
  }

  .ar__item-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .ar__actions {
    flex-direction: column-reverse;

    .ar__btn {
      width: 100%;
    }
  }
}
</style>
