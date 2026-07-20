<script setup lang="ts">
import ApiState from "@/components/ui/ApiState.vue";
import type { Course, Lesson } from "@/types";
import { formatDuration, statusLabel } from "./useAdminCourses";

defineProps<{ selected: Course | null; lessons: Lesson[]; loading: boolean }>();
const emit = defineEmits<{
  editCourse: [course: Course];
  createLesson: [];
  editLesson: [lesson: Lesson];
  removeLesson: [lesson: Lesson];
  moveLesson: [index: number, direction: number];
}>();
</script>

<template>
  <main class="lesson-panel">
    <div v-if="selected" class="lesson-panel__content">
      <header class="lesson-panel__header">
        <div>
          <span class="status" :class="`status--${selected.status || 'draft'}`">
            {{ statusLabel(selected.status) }}
          </span>
          <h3>{{ selected.title }}</h3>
          <p>{{ lessons.length }} {{ lessons.length === 1 ? "clase" : "clases" }} en este curso</p>
        </div>
        <div class="lesson-panel__actions">
          <button class="button button--quiet" type="button" @click="emit('editCourse', selected)">
            Editar curso
          </button>
          <button class="button button--primary" type="button" @click="emit('createLesson')">
            <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva clase
          </button>
        </div>
      </header>

      <ApiState v-if="loading" loading />
      <div v-else-if="!lessons.length" class="lesson-empty">
        <span><i class="fa-solid fa-circle-play" aria-hidden="true" /></span>
        <h4>Ahora agrega la primera clase</h4>
        <p>
          Sube el video, añade una descripción y guarda en borrador. Podrás
          publicarla cuando esté revisada.
        </p>
        <button class="button button--primary" type="button" @click="emit('createLesson')">
          Crear primera clase
        </button>
      </div>
      <div v-else class="lesson-list">
        <article v-for="(lesson, index) in lessons" :key="lesson._id" class="lesson-row">
          <span class="lesson-row__number">{{ String(index + 1).padStart(2, "0") }}</span>
          <span class="lesson-row__media" :class="{ 'lesson-row__media--ready': lesson.video }">
            <i class="fa-solid" :class="lesson.video ? 'fa-play' : 'fa-video-slash'" aria-hidden="true" />
          </span>
          <div class="lesson-row__copy">
            <strong>{{ lesson.title }}</strong>
            <span>
              <b class="status" :class="`status--${lesson.status || 'draft'}`">{{ statusLabel(lesson.status) }}</b>
              · {{ formatDuration(lesson.durationSeconds) }} · {{ lesson.materials?.length || 0 }} materiales
            </span>
          </div>
          <div class="lesson-row__actions">
            <button type="button" :disabled="index === 0" aria-label="Subir clase" @click="emit('moveLesson', index, -1)">
              <i class="fa-solid fa-arrow-up" />
            </button>
            <button type="button" :disabled="index === lessons.length - 1" aria-label="Bajar clase" @click="emit('moveLesson', index, 1)">
              <i class="fa-solid fa-arrow-down" />
            </button>
            <button type="button" aria-label="Editar clase" @click="emit('editLesson', lesson)">
              <i class="fa-solid fa-pen" />
            </button>
            <button class="danger" type="button" aria-label="Eliminar clase" @click="emit('removeLesson', lesson)">
              <i class="fa-solid fa-trash" />
            </button>
          </div>
        </article>
      </div>
    </div>
    <div v-else class="course-placeholder">
      <span><i class="fa-solid fa-arrow-left" aria-hidden="true" /></span>
      <h4>Selecciona un curso</h4>
      <p>Aquí podrás organizar sus clases, videos y materiales.</p>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@include shared.button;
@include shared.status;

.lesson-panel {
  flex: 1 1 auto; padding: 1.25rem; min-width: 0;
  background: $lpb-white; border: 1px solid var(--border); border-radius: 1.25rem;
}
.lesson-panel__header { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
.lesson-panel__header h3 { font: 400 1.55rem $font-display; margin: 0.45rem 0 0.15rem; }
.lesson-panel__header p { font: 0.75rem $font-mono; color: $lpb-muted; margin: 0; }
.lesson-panel__actions { display: flex; align-items: center; gap: 0.5rem; }
.lesson-empty, .course-placeholder {
  min-height: 390px; display: flex; align-items: center; justify-content: center;
  flex-direction: column; text-align: center;
}
.lesson-empty > span, .course-placeholder > span {
  width: 54px; height: 54px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba($lpb-green, 0.13); color: $lpb-green-deep; font-size: 1.2rem;
}
.lesson-empty h4, .course-placeholder h4 { font: 400 1.45rem $font-display; margin: 0.8rem 0 0.35rem; }
.lesson-empty p, .course-placeholder p { max-width: 430px; font: 0.82rem/1.5 $font-sans; color: $lpb-muted; margin: 0 0 1rem; }
.lesson-list { display: flex; flex-direction: column; }
.lesson-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.85rem 0.25rem; border-bottom: 1px solid var(--border); }
.lesson-row__number { width: 34px; flex: 0 0 34px; font: 600 0.65rem $font-mono; color: $lpb-muted; }
.lesson-row__media {
  width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
  flex: 0 0 38px; border-radius: 0.65rem; background: $lpb-cream; color: $lpb-muted; font-size: 0.72rem;
}
.lesson-row__media--ready { background: rgba($lpb-green, 0.16); color: $lpb-green-deep; }
.lesson-row__copy { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.lesson-row__copy > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 0.84rem $font-sans; }
.lesson-row__copy > span { font: 0.62rem $font-mono; color: $lpb-muted; }
.lesson-row__actions { display: flex; gap: 0.15rem; }
.lesson-row__actions button {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: $lpb-muted; cursor: pointer;
}
.lesson-row button:focus-visible { outline: 3px solid rgba($lpb-green, 0.45); outline-offset: 2px; }
.lesson-row__actions button:hover { background: $lpb-cream; color: $lpb-black; }
.lesson-row__actions button:disabled { opacity: 0.25; cursor: not-allowed; }
.danger { color: $alert-error !important; }
@media (max-width: 1100px) {
  .lesson-panel__header { align-items: flex-start; flex-direction: column; }
  .lesson-panel__actions { width: 100%; }
}
@media (max-width: 760px) {
  .lesson-panel { padding: 1rem; }
  .lesson-panel__actions { flex-direction: column; align-items: stretch; }
  .lesson-row { flex-wrap: wrap; }
  .lesson-row__actions { width: 100%; justify-content: flex-end; }
}
</style>
