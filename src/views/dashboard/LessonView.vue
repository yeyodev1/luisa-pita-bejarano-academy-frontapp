<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton.vue'
import LessonVideoPlayer from '@/components/dashboard/LessonVideoPlayer.vue'
import LessonComments from '@/components/dashboard/LessonComments.vue'

const route = useRoute()
const store = useDashboardStore()
const ready = ref(false)
const lessonId = computed(() => String(route.params.lessonId))

async function load() {
  ready.value = false
  await Promise.all([store.fetchLesson(lessonId.value), store.fetchComments(lessonId.value)])
  ready.value = true
}

onMounted(load)
watch(lessonId, load)

async function progress(watched: number, position: number, duration: number) {
  try { await store.saveProgress(lessonId.value, watched, position, duration) } catch {}
}

async function toggleComplete() {
  const lesson = store.currentLesson
  if (!lesson) return
  const complete = !lesson.progress?.completed
  await store.saveProgress(lesson._id, lesson.progress?.watchedSeconds || 0, lesson.progress?.lastPositionSeconds || 0, lesson.durationSeconds, complete)
}

</script>

<template>
  <div class="lesson-page">
    <DashboardSkeleton v-if="!ready" />
    <ApiState v-else :error="store.error" :empty="!store.currentLesson" empty-text="Clase no encontrada." @retry="load">
      <div v-if="store.currentLesson" class="lesson">
        <nav><RouterLink :to="{ name: 'courses' }">Cursos</RouterLink><span>/</span><RouterLink :to="{ name: 'course-detail', params: { slug: route.params.slug } }">Curso</RouterLink><span>/</span>{{ store.currentLesson.title }}</nav>
        <LessonVideoPlayer v-if="store.currentLesson.video" :key="lessonId" :asset="store.currentLesson.video" :resume-at="store.currentLesson.progress?.lastPositionSeconds" :watched-seconds="store.currentLesson.progress?.watchedSeconds" @progress="progress" />
        <section v-else class="empty">Esta clase todavía no tiene video.</section>
        <section class="meta"><div><h1>{{ store.currentLesson.title }}</h1><p>{{ store.currentLesson.content || store.currentLesson.summary }}</p><a v-for="material in store.currentLesson.materials" :key="material.publicId" :href="material.deliveryUrl" target="_blank" rel="noopener">{{ material.title }}</a></div><button type="button" @click="toggleComplete">{{ store.currentLesson.progress?.completed ? 'Marcar pendiente' : 'Marcar completada' }}</button></section>
        <LessonComments :lesson-id="lessonId" />
      </div>
    </ApiState>
  </div>
</template>

<style lang="scss" scoped>
.lesson-page,.lesson{display:flex;min-width:0;flex-direction:column}.lesson{gap:1.4rem}nav{display:flex;gap:.5rem;overflow:hidden;font:.8rem $font-sans;color:$lpb-green-deep;white-space:nowrap}nav a{color:$lpb-green-deep}.meta{display:flex;justify-content:space-between;gap:1.5rem;background:$lpb-white;border:1px solid rgba($lpb-green-deep,.22);border-radius:1rem;padding:1.5rem}.meta h1{font:400 1.5rem $font-display;margin:0}.meta p{font:.92rem/1.55 $font-sans;color:$lpb-black}.meta a{font:600 .7rem $font-mono;color:$lpb-green-deep;text-transform:uppercase}.meta button{align-self:flex-start;padding:.75rem 1rem;border-radius:999px;background:$lpb-black;color:$lpb-white;font:600 .7rem $font-mono;text-transform:uppercase;white-space:nowrap}.empty{color:$lpb-green-deep!important}@media(max-width:640px){.meta{flex-direction:column;padding:1rem}}
</style>
