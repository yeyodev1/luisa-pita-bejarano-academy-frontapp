<script setup lang="ts">
import type { Course } from "@/types";
import { statusLabel } from "./useAdminCourses";

defineProps<{ courses: Course[]; selectedId?: string }>();
const emit = defineEmits<{
  select: [course: Course];
  edit: [course: Course];
  remove: [course: Course];
  move: [index: number, direction: number];
  refresh: [];
}>();
</script>

<template>
  <section class="library">
    <div class="library__header">
      <div>
        <span class="eyebrow">Biblioteca</span>
        <h3>Elige un curso para gestionar sus clases</h3>
      </div>
      <button class="button button--quiet" type="button" @click="emit('refresh')">
        <i class="fa-solid fa-rotate" aria-hidden="true" /> Actualizar
      </button>
    </div>
    <div class="workspace">
      <aside class="course-list" aria-label="Cursos">
        <article
          v-for="(course, index) in courses"
          :key="course._id"
          class="course-card"
          :class="{ 'course-card--active': selectedId === course._id }"
        >
          <button class="course-card__select" type="button" @click="emit('select', course)">
            <span class="course-card__cover">
              <img v-if="course.cover?.deliveryUrl" :src="course.cover.deliveryUrl" alt="" />
              <i v-else class="fa-solid fa-book-open" aria-hidden="true" />
            </span>
            <span class="course-card__body">
              <span class="status" :class="`status--${course.status || 'draft'}`">
                {{ statusLabel(course.status) }}
              </span>
              <strong>{{ course.title }}</strong>
              <small>{{ course.summary || "Sin resumen todavía" }}</small>
            </span>
            <i class="fa-solid fa-chevron-right course-card__arrow" aria-hidden="true" />
          </button>
          <div class="course-card__actions">
            <button type="button" :disabled="index === 0" aria-label="Subir curso" @click="emit('move', index, -1)"><i class="fa-solid fa-arrow-up" /></button>
            <button type="button" :disabled="index === courses.length - 1" aria-label="Bajar curso" @click="emit('move', index, 1)"><i class="fa-solid fa-arrow-down" /></button>
            <button type="button" aria-label="Editar curso" @click="emit('edit', course)"><i class="fa-solid fa-pen" /></button>
            <button class="danger" type="button" aria-label="Eliminar curso" @click="emit('remove', course)"><i class="fa-solid fa-trash" /></button>
          </div>
        </article>
      </aside>
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@include shared.button;
@include shared.eyebrow;
@include shared.status;

.library { display: flex; flex-direction: column; gap: 0.85rem; }
.library__header { display: flex; justify-content: space-between; align-items: flex-end; }
.library__header h3 { font: 400 1.35rem $font-display; margin: 0.3rem 0 0; }
.workspace { display: flex; align-items: flex-start; gap: 1rem; min-height: 520px; }
.course-list {
  width: min(360px, 32%);
  flex: 0 0 auto;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-self: start;
  max-height: 680px;
  overflow-y: auto;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
}
.course-card {
  border: 1px solid transparent;
  border-radius: 0.9rem;
  background: $lpb-paper;
  overflow: hidden;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}
.course-card--active { border-color: rgba($lpb-green-deep, 0.4); box-shadow: 0 6px 18px rgba($lpb-black, 0.06); }
.course-card__select { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; text-align: left; cursor: pointer; }
.course-card__cover {
  width: 58px; flex: 0 0 58px; aspect-ratio: 1; border-radius: 0.65rem;
  display: flex; align-items: center; justify-content: center; background: $lpb-cream;
  color: $lpb-green-deep; overflow: hidden;
}
.course-card__cover img { width: 100%; height: 100%; object-fit: cover; }
.course-card__body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; }
.course-card__body strong, .course-card__body small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.course-card__body strong { font: 600 0.84rem $font-sans; }
.course-card__body small { font: 0.68rem $font-sans; color: $lpb-muted; }
.course-card__arrow { font-size: 0.7rem; color: $lpb-muted; }
.course-card__actions { display: flex; justify-content: flex-end; gap: 0.25rem; padding: 0.35rem 0.55rem; border-top: 1px solid var(--border); }
.course-card__actions button {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: $lpb-muted; cursor: pointer;
}
.course-card button:focus-visible { outline: 3px solid rgba($lpb-green, 0.45); outline-offset: 2px; }
.course-card__actions button:hover { background: $lpb-cream; color: $lpb-black; }
.course-card__actions button:disabled { opacity: 0.25; cursor: not-allowed; }
.danger { color: $alert-error !important; }
@media (max-width: 760px) {
  .library__header { align-items: flex-start; gap: 0.75rem; flex-direction: column; }
  .workspace { flex-direction: column; }
  .course-list { width: 100%; max-height: none; }
}
</style>
