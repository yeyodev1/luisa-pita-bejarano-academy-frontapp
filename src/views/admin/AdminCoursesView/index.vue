<script setup lang="ts">
import ApiState from "@/components/ui/ApiState.vue";
import AdminCourseEditor from "./AdminCourseEditor.vue";
import AdminCourseLibrary from "./AdminCourseLibrary.vue";
import AdminCoursesHero from "./AdminCoursesHero.vue";
import AdminCourseSetupGuide from "./AdminCourseSetupGuide.vue";
import AdminLessonEditor from "./AdminLessonEditor.vue";
import AdminLessonPanel from "./AdminLessonPanel.vue";
import { useAdminCourses } from "./useAdminCourses";

const manager = useAdminCourses();
</script>

<template>
  <div class="academy-manager">
    <AdminCoursesHero
      :course-count="manager.courses.value.length"
      :published-courses="manager.publishedCourses.value"
      :lesson-count="manager.lessons.value.length"
      :published-lessons="manager.publishedLessons.value"
      :has-selected-course="Boolean(manager.selected.value)"
      :setup-progress="manager.setupProgress.value"
      @create="manager.openCourseEditor()"
    />
    <AdminCourseSetupGuide
      :steps="manager.setupSteps.value"
      :progress="manager.setupProgress.value"
      :selected-title="manager.selected.value?.title"
    />

    <p v-if="manager.error.value" class="alert" role="alert">{{ manager.error.value }}</p>
    <ApiState v-if="manager.loading.value && !manager.courses.value.length" loading />

    <section v-else-if="!manager.courses.value.length" class="empty-state">
      <div class="empty-state__art" aria-hidden="true">
        <span class="empty-state__book"><i class="fa-solid fa-book-open" /></span>
        <i class="fa-solid fa-play empty-state__play" />
      </div>
      <span class="eyebrow">Tu biblioteca está vacía</span>
      <h3>Crea un espacio que guíe, no que abrume</h3>
      <p>
        Comienza con el nombre y la promesa del curso. Después podrás añadir
        videos, materiales descargables y publicar cada clase a tu ritmo.
      </p>
      <button class="button button--primary" type="button" @click="manager.openCourseEditor()">
        Crear mi primer curso
      </button>
      <small>No se publicará nada automáticamente.</small>
    </section>

    <AdminCourseLibrary
      v-else
      :courses="manager.courses.value"
      :selected-id="manager.selected.value?._id"
      @select="manager.choose"
      @edit="manager.openCourseEditor"
      @remove="manager.deleteCourse"
      @move="manager.moveCourse"
      @refresh="manager.loadCourses()"
    >
      <AdminLessonPanel
        :selected="manager.selected.value"
        :lessons="manager.lessons.value"
        :loading="manager.lessonsLoading.value"
        @edit-course="manager.openCourseEditor"
        @create-lesson="manager.openLessonEditor()"
        @edit-lesson="manager.openLessonEditor"
        @remove-lesson="manager.deleteLesson"
        @move-lesson="manager.moveLesson"
      />
    </AdminCourseLibrary>

    <AdminCourseEditor
      v-if="manager.editor.value === 'course' && manager.courseDraft.value"
      :key="manager.editingCourse.value || 'new-course'"
      :initial-value="manager.courseDraft.value"
      :editing="Boolean(manager.editingCourse.value)"
      :saving="manager.saving.value"
      :remove-asset="manager.removeAsset"
      @close="manager.closeEditor"
      @save="manager.saveCourse"
    />
    <AdminLessonEditor
      v-if="manager.editor.value === 'lesson' && manager.lessonDraft.value && manager.selected.value"
      :key="manager.editingLesson.value || 'new-lesson'"
      :initial-value="manager.lessonDraft.value"
      :editing="Boolean(manager.editingLesson.value)"
      :saving="manager.saving.value"
      :course-title="manager.selected.value.title"
      :remove-asset="manager.removeAsset"
      @close="manager.closeEditor"
      @save="manager.saveLesson"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@include shared.button;
@include shared.eyebrow;

.academy-manager {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1440px;
  margin: 0 auto;
  color: $lpb-black;
}
.academy-manager > * {
  opacity: 0;
  transform: translateY(18px);
  animation: section-enter 0.65s cubic-bezier(0.2, 0.7, 0, 1) forwards;
}
.academy-manager > :nth-child(2) { animation-delay: 0.08s; }
.academy-manager > :nth-child(3) { animation-delay: 0.16s; }
.academy-manager > :nth-child(4) { animation-delay: 0.24s; }
.academy-manager > :nth-child(5) { animation-delay: 0.3s; }
.alert {
  padding: 0.8rem 1rem;
  margin: 0;
  border: 1px solid rgba($alert-error, 0.25);
  border-radius: 0.75rem;
  background: rgba($alert-error, 0.06);
  color: $alert-error;
  font: 0.82rem $font-sans;
}
.empty-state {
  min-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 3rem 1.5rem;
  border: 1px dashed rgba($lpb-green-deep, 0.3);
  border-radius: 1.5rem;
  background: $lpb-white;
  text-align: center;
}
.empty-state__art { position: relative; width: 120px; height: 100px; margin-bottom: 1.25rem; }
.empty-state__book {
  position: absolute;
  inset: 10px 5px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: $lpb-cream;
  color: $lpb-green-deep;
  font-size: 2.5rem;
  transform: rotate(-5deg);
}
.empty-state__play {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px;
  border-radius: 50%;
  background: $lpb-green;
  color: $lpb-black;
  box-shadow: 0 8px 20px rgba($lpb-black, 0.15);
}
.empty-state h3 { font: 400 2rem $font-display; margin: 0.6rem 0; }
.empty-state p { max-width: 570px; font: 0.92rem/1.6 $font-sans; color: $lpb-muted; margin: 0 0 1.25rem; }
.empty-state small { margin-top: 0.8rem; font: 0.67rem $font-mono; color: $lpb-muted; }
@keyframes section-enter { to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .academy-manager > * { opacity: 1; transform: none; animation: none; }
}
</style>
