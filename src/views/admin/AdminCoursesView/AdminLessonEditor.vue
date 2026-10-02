<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import MediaUploader from "@/components/admin/MediaUploader.vue";
import type { MediaAsset } from "@/types";
import AdminEditorShell from "./AdminEditorShell.vue";
import type { LessonDraft } from "./types";
import { formatDuration } from "./useAdminCourses";

const props = defineProps<{
  initialValue: LessonDraft;
  editing: boolean;
  saving: boolean;
  courseTitle: string;
  error?: string;
  removeAsset: (asset: MediaAsset | null | undefined) => Promise<void>;
}>();
const emit = defineEmits<{
  close: [];
  save: [draft: LessonDraft];
  uploading: [value: boolean];
}>();
const form = reactive<LessonDraft>({
  ...props.initialValue,
  materials: [...props.initialValue.materials],
});

async function setVideo(asset: MediaAsset) {
  await props.removeAsset(form.video);
  form.video = asset;
  form.durationSeconds = Math.round(asset.duration || 0);
}

async function clearAsset(kind: "video" | "thumbnail") {
  await props.removeAsset(form[kind]);
  form[kind] = null;
}

/** Subidas en curso (video, miniatura, material): no se guarda ni se cierra a medias. */
const busyUploads = ref(new Set<string>());
const uploading = computed(() => busyUploads.value.size > 0);

function trackBusy(slot: string, value: boolean) {
  const next = new Set(busyUploads.value);
  if (value) next.add(slot);
  else next.delete(slot);
  busyUploads.value = next;
  emit("uploading", next.size > 0);
}

// El nombre se edita en la lista; si queda vacío se usa el del archivo.
function addMaterial(asset: MediaAsset) {
  form.materials.push({
    ...asset,
    title: asset.originalFilename || "Material descargable",
  });
}

async function removeMaterial(index: number) {
  await props.removeAsset(form.materials[index]);
  form.materials.splice(index, 1);
}

function submit() {
  if (uploading.value) return;
  const materials = form.materials.map((material) => ({
    ...material,
    title: material.title?.trim() || material.originalFilename || "Material descargable",
  }));
  emit("save", { ...form, materials });
}

async function close() {
  if (
    uploading.value &&
    !confirm("Hay un archivo subiéndose. Si cierras ahora se cancelará. ¿Cerrar de todos modos?")
  )
    return;
  await Promise.allSettled([
    props.removeAsset(form.video),
    props.removeAsset(form.thumbnail),
    ...form.materials.map((material) => props.removeAsset(material)),
  ]);
  emit("close");
}
</script>

<template>
  <AdminEditorShell
    eyebrow="Contenido del curso"
    :title="editing ? 'Editar clase' : 'Añadir una clase'"
    :subtitle="courseTitle"
    labelled-by="lesson-editor-title"
    @close="close"
  >
    <form class="editor-form" @submit.prevent="submit">
      <section class="form-section">
        <div class="form-section__heading">
          <span>01</span>
          <div>
            <h3>Información de la clase</h3>
            <p>El video puede subirse antes o después de guardar.</p>
          </div>
        </div>
        <div class="form-fields">
          <label class="field field--wide">
            <span>Título de la clase *</span>
            <input v-model="form.title" required maxlength="140" placeholder="Ej. Cómo construir un plato balanceado" />
          </label>
          <label class="field field--wide">
            <span>Resumen</span>
            <input v-model="form.summary" maxlength="220" placeholder="Qué aprenderá en esta clase" />
          </label>
          <label class="field field--wide">
            <span>Contenido o notas</span>
            <textarea v-model="form.content" rows="5" placeholder="Incluye puntos clave, instrucciones o recomendaciones" />
          </label>
          <label class="field">
            <span>¿La ven las alumnas?</span>
            <select v-model="form.status">
              <option value="draft">No todavía (borrador)</option>
              <option value="published">Sí, publicada</option>
              <option value="archived">Archivada (oculta, se conserva)</option>
            </select>
          </label>
          <div class="field">
            <span>Duración</span>
            <p class="field__static">
              {{ form.durationSeconds ? formatDuration(form.durationSeconds) : "Se completa sola al subir el video" }}
            </p>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section__heading">
          <span>02</span>
          <div>
            <h3>Video principal</h3>
            <p>La duración se completa automáticamente al subirlo.</p>
          </div>
        </div>
        <div class="media-field" :class="{ 'media-field--ready': form.video }">
          <div class="media-field__info">
            <i class="fa-solid fa-circle-play" aria-hidden="true" />
            <span>
              <strong>{{ form.video ? "Video cargado" : "Sube el video de esta clase" }}</strong>
              <small>{{ form.video?.originalFilename || "El video se procesa de forma segura. MP4 o MOV." }}</small>
            </span>
          </div>
          <MediaUploader
            resource-type="video"
            category="lessons"
            :label="form.video ? 'Reemplazar video' : 'Subir video'"
            @busy="trackBusy('video', $event)"
            @uploaded="setVideo"
          />
          <button v-if="form.video" class="text-button danger" type="button" @click="clearAsset('video')">Quitar</button>
        </div>
      </section>

      <section class="form-section form-section--split">
        <div>
          <div class="form-section__heading">
            <span>03</span>
            <div><h3>Miniatura</h3><p>Opcional para identificar la clase.</p></div>
          </div>
          <div class="media-compact">
            <MediaUploader
              resource-type="image"
              category="lessons"
              :label="form.thumbnail ? 'Reemplazar miniatura' : 'Subir miniatura'"
              @busy="trackBusy('thumbnail', $event)"
              @uploaded="form.thumbnail = $event"
            />
            <button v-if="form.thumbnail" class="text-button danger" type="button" @click="clearAsset('thumbnail')">Quitar</button>
          </div>
        </div>
        <div>
          <div class="form-section__heading">
            <span>04</span>
            <div><h3>Materiales</h3><p>PDF, guía o recurso descargable.</p></div>
          </div>
          <MediaUploader
            resource-type="raw"
            category="materials"
            label="Añadir material"
            @busy="trackBusy('material', $event)"
            @uploaded="addMaterial"
          />
          <ul class="materials">
            <li v-for="(material, index) in form.materials" :key="material.publicId">
              <i class="fa-solid fa-paperclip" />
              <input
                v-model="material.title"
                class="materials__name"
                maxlength="120"
                :placeholder="material.originalFilename || 'Nombre que verá la alumna'"
                aria-label="Nombre que verá la alumna"
              />
              <button type="button" aria-label="Quitar material" @click="removeMaterial(index)">
                <i class="fa-solid fa-xmark" />
              </button>
            </li>
          </ul>
        </div>
      </section>
      <footer class="editor-footer">
        <p v-if="error" class="editor-error editor-footer__error" role="alert">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {{ error }}
        </p>
        <p v-if="uploading" class="editor-footer__hint">
          <i class="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Espera a que termine de subirse el archivo para guardar.
        </p>
        <button class="button button--quiet" type="button" @click="close">Cancelar</button>
        <button class="button button--primary" type="submit" :disabled="saving || uploading">
          {{ saving ? "Guardando..." : uploading ? "Subiendo archivo…" : "Guardar clase" }}
        </button>
      </footer>
    </form>
  </AdminEditorShell>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@use "./editor" as editor;
@include shared.button;
@include editor.form;

.form-section--split { display: flex; gap: 1.5rem; }
.form-section--split > div { flex: 1 1 0; min-width: 0; }
.media-compact { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.materials { display: flex; flex-direction: column; gap: 0.4rem; list-style: none; padding: 0; margin: 0.75rem 0 0; }
.materials li { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.65rem; border-radius: 0.6rem; background: $lpb-white; font: 0.72rem $font-sans; }
.materials__name { flex: 1; min-width: 0; border: 1px solid var(--border); border-radius: 0.45rem; padding: 0.35rem 0.5rem; font: 0.75rem $font-sans; background: $lpb-white; }
.field__static { margin: 0; padding: 0.78rem 0; font: 0.82rem $font-sans; color: $lpb-graphite; }
.materials li button { width: 26px; height: 26px; border-radius: 50%; color: $alert-error; }
@media (max-width: 760px) { .form-section--split { flex-direction: column; } }
</style>
