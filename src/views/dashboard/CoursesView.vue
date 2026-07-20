<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'

const store = useDashboardStore()
onMounted(() => store.fetchCourses())
</script>

<template>
  <ApiState :loading="store.loading" :error="store.error" :empty="!store.courses.length" empty-text="Aún no hay cursos publicados." @retry="store.fetchCourses">
    <div class="course-grid">
      <RouterLink v-for="course in store.courses" :key="course._id" :to="{ name: 'course-detail', params: { slug: course.slug } }" class="course-card">
        <div class="course-card__image">
          <img v-if="course.cover?.deliveryUrl" :src="course.cover.deliveryUrl" :alt="course.title">
        </div>
        <div class="course-card__body">
          <h2>{{ course.title }}</h2><p>{{ course.summary || course.description }}</p>
          <small>{{ course.progress.completedLessons }} de {{ course.progress.totalLessons }} clases</small>
          <div class="progress"><i :style="{ width: `${course.progress.percent}%` }" /></div>
        </div>
      </RouterLink>
    </div>
  </ApiState>
</template>

<style lang="scss" scoped>
.course-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; }
.course-card { background:$lpb-white; border:1px solid var(--border); border-radius:1rem; overflow:hidden; transition:.2s; &:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba($lpb-black,.08); } }
.course-card__image { aspect-ratio:16/9; background:rgba($lpb-green,.1); position:relative; img { width:100%; height:100%; object-fit:cover; } span { position:absolute; left:.75rem; top:.75rem; padding:.35rem .6rem; border-radius:999px; background:$lpb-paper; font:600 .65rem $font-mono; text-transform:uppercase; } }
.course-card__body { padding:1.2rem; h2 { margin:0; color:$lpb-black; font:400 1.2rem $font-display; } p { color:$lpb-muted; font:.88rem/1.5 $font-sans; min-height:2.6em; } small { color:$lpb-muted; font:.7rem $font-mono; } }
.progress { margin-top:.75rem; height:6px; border-radius:9px; overflow:hidden; background:rgba($lpb-black,.07); i { display:block; height:100%; background:$lpb-green; } }
@media(max-width:1100px){.course-grid{grid-template-columns:repeat(2,1fr)}} @media(max-width:640px){.course-grid{grid-template-columns:1fr}}
</style>
