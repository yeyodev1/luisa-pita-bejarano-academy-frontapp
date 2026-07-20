<script setup lang="ts">
import { reactive } from "vue";
import MediaUploader from "@/components/admin/MediaUploader.vue";
import type { MediaAsset } from "@/types";
import AdminEditorShell from "./AdminEditorShell.vue";
import type { LessonDraft } from "./types";

const props = defineProps<{
  initialValue: LessonDraft;
  editing: boolean;
  saving: boolean;
  courseTitle: string;
  removeAsset: (asset: MediaAsset | null | undefined) => Promise<void>;
}>();
const emit = defineEmits<{ close: []; save: [draft: LessonDraft] }>();
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

function addMaterial(asset: MediaAsset) {
  const title = prompt(
    "Nombre que verá la estudiante",
    asset.originalFilename || "Material descargable",
  )?.trim();
  if (title) form.materials.push({ ...asset, title });
}

async function removeMaterial(index: number) {
  await props.removeAsset(form.materials[index]);
  form.materials.splice(index, 1);
}

function submit() {
  emit("save", { ...form, materials: [...form.materials] });
}

async function close() {
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
            <span>Estado</span>
            <select v-model="form.status">
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada</option>
            </select>
          </label>
          <label class="field">
            <span>Duración</span>
            <div class="input-suffix">
              <input v-model.number="form.durationSeconds" type="number" min="0" />
              <span>seg</span>
            </div>
          </label>
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
              <small>{{ form.video?.originalFilename || "Cloudinary procesará el archivo de forma segura" }}</small>
            </span>
          </div>
          <MediaUploader
            resource-type="video"
            category="lessons"
            :label="form.video ? 'Reemplazar video' : 'Subir video'"
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
          <MediaUploader resource-type="raw" category="materials" label="Añadir material" @uploaded="addMaterial" />
          <ul class="materials">
            <li v-for="(material, index) in form.materials" :key="material.publicId">
              <i class="fa-solid fa-paperclip" />
              <span>{{ material.title }}</span>
              <button type="button" aria-label="Quitar material" @click="removeMaterial(index)">
                <i class="fa-solid fa-xmark" />
              </button>
            </li>
          </ul>
        </div>
      </section>
      <footer class="editor-footer">
        <button class="button button--quiet" type="button" @click="emit('close')">Cancelar</button>
        <button class="button button--primary" type="submit" :disabled="saving">
          {{ saving ? "Guardando..." : "Guardar clase" }}
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
.materials li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.materials li button { width: 26px; height: 26px; border-radius: 50%; color: $alert-error; }
@media (max-width: 760px) { .form-section--split { flex-direction: column; } }
</style>
