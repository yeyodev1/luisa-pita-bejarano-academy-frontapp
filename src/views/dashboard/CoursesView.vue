<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton.vue'

const store = useDashboardStore()
const ready = ref(false)

async function load() {
  ready.value = false
  await store.fetchCourses()
  ready.value = true
}

onMounted(load)
</script>

<template>
  <div class="courses-page">
    <DashboardSkeleton v-if="!ready" />
    <ApiState v-else :error="store.error" :empty="!store.courses.length" empty-text="Aún no hay cursos publicados." @retry="load">
      <div class="course-list">
        <RouterLink v-for="course in store.courses" :key="course._id" :to="{ name: 'course-detail', params: { slug: course.slug } }" class="course-card">
          <div class="course-card__image"><img v-if="course.cover?.deliveryUrl" :src="course.cover.deliveryUrl" :alt="course.title"></div>
          <div class="course-card__body"><h2>{{ course.title }}</h2><p>{{ course.summary || course.description }}</p><small>{{ course.progress.completedLessons }} de {{ course.progress.totalLessons }} clases</small><div class="progress"><i :style="{ width: `${course.progress.percent}%` }" /></div></div>
        </RouterLink>
      </div>
    </ApiState>
  </div>
</template>

<style lang="scss" scoped>
.courses-page,.course-list{display:flex;min-width:0}.courses-page{flex-direction:column}.course-list{flex-wrap:wrap;gap:1.25rem}.course-card{display:flex;flex:1 1 300px;max-width:calc(33.333% - .85rem);flex-direction:column;background:$lpb-white;border:1px solid rgba($lpb-green-deep,.22);border-radius:1rem;overflow:hidden;transition:.2s}.course-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba($lpb-green-deep,.14)}.course-card__image{display:flex;aspect-ratio:16/9;background:rgba($lpb-green,.1);position:relative}.course-card__image img{width:100%;height:100%;object-fit:cover}.course-card__body{display:flex;flex:1;flex-direction:column;padding:1.2rem}.course-card__body h2{margin:0;color:$lpb-black;font:400 1.2rem $font-display}.course-card__body p{color:$lpb-green-deep;font:.88rem/1.5 $font-sans;min-height:2.6em}.course-card__body small{color:$lpb-green-deep;font:.7rem $font-mono}.progress{display:flex;margin-top:.75rem;height:6px;border-radius:9px;overflow:hidden;background:rgba($lpb-green,.16)}.progress i{display:flex;height:100%;background:$lpb-green}@media(max-width:1100px){.course-card{max-width:calc(50% - .65rem)}}@media(max-width:640px){.course-card{max-width:100%;flex-basis:100%}}
</style>
