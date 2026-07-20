<script setup lang="ts">
import { reactive } from "vue";
import MediaUploader from "@/components/admin/MediaUploader.vue";
import type { MediaAsset } from "@/types";
import AdminEditorShell from "./AdminEditorShell.vue";
import type { CourseDraft } from "./types";

const props = defineProps<{
  initialValue: CourseDraft;
  editing: boolean;
  saving: boolean;
  removeAsset: (asset: MediaAsset | null | undefined) => Promise<void>;
}>();
const emit = defineEmits<{ close: []; save: [draft: CourseDraft] }>();
const form = reactive<CourseDraft>({ ...props.initialValue });

async function removeCover() {
  await props.removeAsset(form.cover);
  form.cover = null;
}
</script>

<template>
  <AdminEditorShell
    eyebrow="Paso 1 · Estructura"
    :title="editing ? 'Editar curso' : 'Crear un nuevo curso'"
    labelled-by="course-editor-title"
    @close="emit('close')"
  >
    <form class="editor-form" @submit.prevent="emit('save', { ...form })">
      <section class="form-section">
        <div class="form-section__heading">
          <span>01</span>
          <div>
            <h3>Identidad del curso</h3>
            <p>Ayuda a la estudiante a entender qué logrará.</p>
          </div>
        </div>
        <div class="form-fields">
          <label class="field field--wide">
            <span>Nombre del curso *</span>
            <input v-model="form.title" required maxlength="120" placeholder="Ej. Nutrición para una vida plena" />
            <small>Claro, específico y orientado al resultado.</small>
          </label>
          <label class="field field--wide">
            <span>Resumen corto</span>
            <input v-model="form.summary" maxlength="220" placeholder="Una frase que explique la transformación" />
          </label>
          <label class="field field--wide">
            <span>Descripción</span>
            <textarea v-model="form.description" rows="5" placeholder="¿Para quién es y qué aprenderá?" />
          </label>
          <label class="field">
            <span>Estado</span>
            <select v-model="form.status">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
          <label class="field">
            <span>URL amigable</span>
            <input v-model="form.slug" placeholder="Se genera automáticamente" />
          </label>
        </div>
      </section>
      <section class="form-section">
        <div class="form-section__heading">
          <span>02</span>
          <div>
            <h3>Portada</h3>
            <p>Recomendado: imagen horizontal 16:9.</p>
          </div>
        </div>
        <div class="media-field" :class="{ 'media-field--ready': form.cover }">
          <div class="media-field__info">
            <i class="fa-solid fa-image" aria-hidden="true" />
            <span>
              <strong>{{ form.cover ? "Portada lista" : "Añade una imagen de portada" }}</strong>
              <small>{{ form.cover?.originalFilename || "JPG, PNG o WebP" }}</small>
            </span>
          </div>
          <MediaUploader
            resource-type="image"
            category="courses"
            :label="form.cover ? 'Reemplazar' : 'Subir portada'"
            @uploaded="form.cover = $event"
          />
          <button v-if="form.cover" class="text-button danger" type="button" @click="removeCover">
            Quitar
          </button>
        </div>
      </section>
      <footer class="editor-footer">
        <button class="button button--quiet" type="button" @click="emit('close')">Cancelar</button>
        <button class="button button--primary" type="submit" :disabled="saving">
          {{ saving ? "Guardando..." : "Guardar curso" }}
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
</style>
