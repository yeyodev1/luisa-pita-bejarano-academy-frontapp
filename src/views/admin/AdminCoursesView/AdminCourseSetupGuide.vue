<script setup lang="ts">
import type { SetupStep } from "./types";

defineProps<{
  steps: SetupStep[];
  progress: number;
  selectedTitle?: string;
}>();
</script>

<template>
  <section class="guide" :class="{ 'guide--complete': progress === 4 }">
    <div class="guide__intro">
      <span class="guide__icon">
        <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
      </span>
      <div>
        <strong>
          {{ progress === 4 ? "Curso listo para tus estudiantes" : "Tu ruta de publicación" }}
        </strong>
        <p>
          {{
            selectedTitle
              ? `Revisa lo que falta en “${selectedTitle}”.`
              : "Empieza creando la estructura de tu primer curso."
          }}
        </p>
      </div>
    </div>
    <ol class="guide__steps">
      <li v-for="step in steps" :key="step.label" :class="{ done: step.done }">
        <span class="guide__step-icon">
          <i
            class="fa-solid"
            :class="step.done ? 'fa-check' : step.icon"
            aria-hidden="true"
          />
        </span>
        <span class="guide__step-copy">
          <strong>{{ step.label }}</strong>
          <small>{{ step.description }}</small>
        </span>
      </li>
    </ol>
  </section>
</template>

<style lang="scss" scoped>
.guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba($lpb-green-deep, 0.22);
  border-radius: 1rem;
  background: rgba($lpb-green, 0.08);
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
}
.guide:hover {
  transform: translateY(-2px);
  border-color: rgba($lpb-green-deep, 0.4);
  background: rgba($lpb-green, 0.12);
}
.guide--complete { background: rgba($lpb-green, 0.16); }
.guide__intro {
  display: flex;
  align-items: center;
  flex: 0 1 300px;
  gap: 0.8rem;
  min-width: 220px;
  max-width: 320px;
}
.guide__icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: $lpb-green;
  color: $lpb-black;
  animation: guide-icon-enter 0.7s 0.3s cubic-bezier(0.2, 0.7, 0, 1) both;
}
.guide__intro strong { font: 600 0.88rem $font-sans; }
.guide__intro p { font: 0.72rem $font-sans; color: $lpb-muted; margin: 0.15rem 0 0; }
.guide__steps {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: flex-end;
  list-style: none;
  margin: 0;
  padding: 0;
}
.guide__steps li {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  color: $lpb-muted;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}
.guide__steps li:hover {
  transform: translateY(-2px);
  border-color: rgba($lpb-green-deep, 0.18);
  background: rgba($lpb-white, 0.7);
}
.guide__step-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 0.65rem;
  background: $lpb-white;
  color: $lpb-green-deep;
  font-size: 0.78rem;
}
.guide__step-copy {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}
.guide__step-copy strong {
  font: 700 0.64rem $font-mono;
  line-height: 1.25;
  color: $lpb-graphite;
  text-transform: uppercase;
}
.guide__step-copy small {
  font: 0.65rem/1.3 $font-sans;
  color: $lpb-muted;
  white-space: normal;
}
.guide__steps li.done { color: $lpb-green-deep; }
.guide__steps li.done .guide__step-icon {
  background: $lpb-green-deep;
  color: $lpb-white;
  border-color: $lpb-green-deep;
}
.guide__steps li.done .guide__step-copy strong { color: $lpb-green-deep; }
@keyframes guide-icon-enter {
  from { opacity: 0; transform: scale(0.65) rotate(-18deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}
@media (max-width: 1500px) {
  .guide { align-items: flex-start; flex-direction: column; }
  .guide__intro { flex-basis: auto; max-width: none; }
  .guide__steps { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .guide__steps li { flex: 1 1 calc(50% - 0.65rem); min-width: 280px; }
}
@media (max-width: 760px) {
  .guide__steps { align-items: stretch; flex-direction: column; gap: 0.7rem; }
  .guide__steps li { width: 100%; min-width: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .guide__icon { opacity: 1; transform: none; animation: none; }
  .guide, .guide__steps li { transition: none; }
}
</style>
