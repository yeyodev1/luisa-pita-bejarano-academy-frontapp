<script setup lang="ts">
defineProps<{ title: string; eyebrow: string; subtitle?: string; labelledBy: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <section class="editor-modal" role="dialog" aria-modal="true" :aria-labelledby="labelledBy">
        <header class="editor-modal__header">
          <div>
            <span class="eyebrow">{{ eyebrow }}</span>
            <h2 :id="labelledBy">{{ title }}</h2>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
          <button class="icon-button" type="button" aria-label="Cerrar editor" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "./shared" as shared;
@include shared.eyebrow;

.modal-backdrop {
  position: fixed; inset: 0; z-index: 1200; display: flex; justify-content: flex-end;
  background: rgba($lpb-black, 0.45); backdrop-filter: blur(4px); animation: backdrop-enter 0.25s ease both;
}
.editor-modal {
  width: min(760px, 100%); height: 100dvh; display: flex; flex-direction: column;
  background: $lpb-paper; box-shadow: -20px 0 60px rgba($lpb-black, 0.18);
  overflow: hidden; animation: drawer-enter 0.5s cubic-bezier(0.2, 0.7, 0, 1) both;
}
.editor-modal__header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--border); background: $lpb-white;
}
.editor-modal__header h2 { font: 400 1.8rem $font-display; margin: 0.35rem 0 0; }
.editor-modal__header p { font: 0.75rem $font-mono; color: $lpb-muted; margin: 0.25rem 0 0; }
.icon-button {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: $lpb-muted; cursor: pointer;
}
.icon-button:hover { background: $lpb-cream; color: $lpb-black; }
.icon-button:focus-visible { outline: 3px solid rgba($lpb-green, 0.45); outline-offset: 2px; }
@keyframes backdrop-enter { from { opacity: 0; } to { opacity: 1; } }
@keyframes drawer-enter {
  from { opacity: 0; transform: translateX(48px); }
  to { opacity: 1; transform: translateX(0); }
}
@media (max-width: 760px) {
  .editor-modal { width: 100%; }
  .editor-modal__header { padding-left: 1rem; padding-right: 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop, .editor-modal { opacity: 1; transform: none; animation: none; }
}
</style>
