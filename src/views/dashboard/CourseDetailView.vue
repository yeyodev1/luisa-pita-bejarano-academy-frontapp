<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'
const route = useRoute(); const store = useDashboardStore()
const slug = computed(() => String(route.params.slug))
const load = () => store.fetchCourse(slug.value)
onMounted(load); watch(slug, load)
</script>
<template>
  <ApiState :loading="store.loading" :error="store.error" :empty="!store.currentCourse" empty-text="Curso no encontrado." @retry="load">
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
</template>
<style lang="scss" scoped>
.course{display:flex;flex-direction:column;gap:1.5rem}.hero{min-height:300px;border-radius:1rem;background:$lpb-ink center/cover;display:flex;align-items:flex-end;color:$lpb-white;padding:2rem}.hero div{max-width:700px}.hero small{font:600 .7rem $font-mono;text-transform:uppercase;color:$lpb-green}.hero h1{font:400 clamp(2rem,5vw,3.2rem) $font-display;margin:.3rem 0}.hero p{font:1rem/1.5 $font-sans;margin:0}.lessons{background:$lpb-white;border:1px solid var(--border);border-radius:1rem;padding:1.4rem}.lessons h2{font:400 1.4rem $font-display;margin:0 0 1rem}.lesson{display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:.75rem;background:$lpb-cream;margin-top:.5rem}.lesson>b{font:.75rem $font-mono;color:$lpb-muted}.lesson span{display:flex;flex:1;flex-direction:column;gap:.2rem}.lesson strong{font:600 .95rem $font-sans}.lesson small,.lesson i{font:.68rem $font-mono;color:$lpb-muted}.lesson i{font-style:normal;text-transform:uppercase}.lesson.locked{opacity:.55;cursor:not-allowed}.empty{font-family:$font-sans;color:$lpb-muted}@media(max-width:600px){.hero{padding:1.25rem;min-height:240px}.lesson i{display:none}}
</style>
