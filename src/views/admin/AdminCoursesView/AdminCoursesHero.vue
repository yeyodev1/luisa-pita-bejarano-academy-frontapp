<script setup lang="ts">
defineProps<{
  courseCount: number;
  publishedCourses: number;
  lessonCount: number;
  publishedLessons: number;
  hasSelectedCourse: boolean;
  setupProgress: number;
}>();

const emit = defineEmits<{ create: [] }>();
</script>

<template>
  <section class="hero">
    <div class="hero__copy">
      <span class="eyebrow">Academia digital</span>
      <h2>Construye la experiencia de aprendizaje</h2>
      <p>
        Crea el curso, organiza sus clases y publícalo cuando todo esté listo.
        Los cambios en borrador no son visibles para las estudiantes.
      </p>
    </div>
    <button class="button button--primary" type="button" @click="emit('create')">
      <i class="fa-solid fa-plus" aria-hidden="true" />
      Crear curso
    </button>
  </section>

  <div class="metrics" aria-label="Resumen de contenido">
    <article>
      <span>Cursos</span>
      <strong>{{ courseCount }}</strong>
      <small>{{ publishedCourses }} publicados</small>
    </article>
    <article>
      <span>Curso activo</span>
      <strong>{{ hasSelectedCourse ? lessonCount : "—" }}</strong>
      <small>
        {{
          hasSelectedCourse
            ? `${publishedLessons} clases publicadas`
            : "Selecciona un curso"
        }}
      </small>
    </article>
    <article>
      <span>Configuración</span>
      <strong>{{ setupProgress }}/4</strong>
      <small>pasos completados</small>
    </article>
  </div>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@include shared.button;
@include shared.eyebrow;

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem;
  border-radius: 1.5rem;
  background: $lpb-black;
  color: $lpb-white;
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  right: -80px;
  top: -160px;
  background: rgba($lpb-green, 0.25);
}
.hero__copy { position: relative; z-index: 1; max-width: 720px; }
.hero .eyebrow { color: $lpb-green; }
.hero h2 {
  font: 400 clamp(2rem, 4vw, 3.4rem) / 0.98 $font-display;
  margin: 0.55rem 0 0.8rem;
  max-width: 660px;
}
.hero p {
  font: 0.95rem/1.55 $font-sans;
  color: rgba($lpb-white, 0.7);
  margin: 0;
  max-width: 650px;
}
.hero .button { position: relative; z-index: 1; }
.metrics { display: flex; gap: 0.75rem; }
.metrics article {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem 1.15rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
}
.metrics span { font: 600 0.72rem $font-mono; text-transform: uppercase; color: $lpb-muted; }
.metrics strong {
  position: absolute;
  top: 50%;
  right: 1.15rem;
  transform: translateY(-50%);
  font: 400 2rem $font-display;
}
.metrics small { font: 0.78rem $font-sans; color: $lpb-graphite; }
@media (max-width: 760px) {
  .hero { align-items: flex-start; flex-direction: column; padding: 1.5rem; }
  .hero h2 { font-size: 2.25rem; }
  .metrics { flex-direction: column; }
}
</style>
