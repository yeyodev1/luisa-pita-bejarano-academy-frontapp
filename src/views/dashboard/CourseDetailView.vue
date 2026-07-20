<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton.vue'

const route = useRoute()
const store = useDashboardStore()
const ready = ref(false)
const slug = computed(() => String(route.params.slug))

async function load() {
  ready.value = false
  await store.fetchCourse(slug.value)
  ready.value = true
}

onMounted(load)
watch(slug, load)
</script>

<template>
  <div class="course-page">
    <DashboardSkeleton v-if="!ready" />
    <ApiState v-else :error="store.error" :empty="!store.currentCourse" empty-text="Curso no encontrado." @retry="load">
      <div v-if="store.currentCourse" class="course">
        <header class="hero" :style="store.currentCourse.cover?.deliveryUrl ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.8), rgba(0,0,0,.15)), url(${store.currentCourse.cover.deliveryUrl})` } : {}">
          <div><h1>{{ store.currentCourse.title }}</h1><p>{{ store.currentCourse.description || store.currentCourse.summary }}</p></div>
        </header>
        <section class="lessons"><h2>Contenido del curso</h2>
          <p v-if="!store.currentCourse.lessons?.length" class="empty">Este curso todavía no tiene clases publicadas.</p>
          <RouterLink v-for="(lesson,index) in store.currentCourse.lessons" :key="lesson._id" :to="{ name:'lesson', params:{ slug, lessonId:lesson._id } }" class="lesson">
            <b>{{ String(index+1).padStart(2,'0') }}</b><span><strong>{{ lesson.title }}</strong><small>{{ lesson.durationSeconds ? `${Math.round(lesson.durationSeconds/60)} min` : '' }}</small></span><i>{{ lesson.progress?.completed ? 'Completada' : 'Ver clase' }}</i>
          </RouterLink>
        </section>
      </div>
    </ApiState>
  </div>
</template>

<style lang="scss" scoped>
.course-page,.course{display:flex;flex-direction:column;min-width:0}.course{gap:1.5rem}.hero{min-height:300px;border-radius:1rem;background:$lpb-black center/cover;display:flex;align-items:flex-end;color:$lpb-white;padding:2rem}.hero div{max-width:700px}.hero h1{font:400 clamp(2rem,5vw,3.2rem) $font-display;margin:.3rem 0}.hero p{font:1rem/1.5 $font-sans;margin:0}.lessons{display:flex;flex-direction:column;background:$lpb-white;border:1px solid rgba($lpb-green-deep,.22);border-radius:1rem;padding:1.4rem}.lessons h2{font:400 1.4rem $font-display;margin:0 0 1rem}.lesson{display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:.75rem;background:$lpb-light;margin-top:.5rem;border:1px solid rgba($lpb-green,.16)}.lesson>b{font:.75rem $font-mono;color:$lpb-green-deep}.lesson span{display:flex;flex:1;flex-direction:column;gap:.2rem}.lesson strong{font:600 .95rem $font-sans}.lesson small,.lesson i{font:.68rem $font-mono;color:$lpb-green-deep}.lesson i{font-style:normal;text-transform:uppercase}.empty{font-family:$font-sans;color:$lpb-green-deep}@media(max-width:600px){.hero{padding:1.25rem;min-height:240px}.lesson i{display:none}}
</style>
