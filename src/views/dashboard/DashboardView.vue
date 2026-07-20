<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'
import ApiState from '@/components/ui/ApiState.vue'
const store=useDashboardStore(); const user=useUserStore()
async function load(){await Promise.all([store.fetchCourses(),store.fetchCalendar(),store.fetchAchievements()])}
onMounted(load)
function date(value:string){return new Date(value).toLocaleString('es-EC',{dateStyle:'long',timeStyle:'short'})}
</script>
<template><ApiState :loading="store.loading" :error="store.error" @retry="load"><div class="home">
  <header><small>Bienvenida de vuelta</small><h1>{{ user.name || 'Miembro' }}</h1><p>Tu espacio para avanzar a tu ritmo y participar en la comunidad.</p></header>
  <section class="stats"><article><b>{{ store.totalProgress }}%</b><span>Progreso general</span></article><article><b>{{ store.courses.length }}</b><span>Cursos disponibles</span></article><article><b>{{ store.completedAchievements.length }}</b><span>Logros desbloqueados</span></article></section>
  <a v-if="store.nextEvent" class="event" :href="store.nextEvent.meetingUrl || undefined" target="_blank" rel="noopener"><div><small>Próximo evento</small><h2>{{ store.nextEvent.title }}</h2><p>{{ date(store.nextEvent.startsAt) }}</p></div><b>{{ store.nextEvent.meetingUrl ? 'Abrir Meet' : 'Ver calendario' }}</b></a>
  <section><div class="heading"><h2>Continúa aprendiendo</h2><RouterLink :to="{name:'courses'}">Ver cursos</RouterLink></div><div class="courses"><RouterLink v-for="course in store.courses.slice(0,3)" :key="course._id" :to="{name:'course-detail',params:{slug:course.slug}}"><img v-if="course.cover?.deliveryUrl" :src="course.cover.deliveryUrl"><div><h3>{{course.title}}</h3><p>{{course.summary}}</p><small>{{course.progress.percent}}% completado</small></div></RouterLink></div><p v-if="!store.courses.length" class="empty">Aún no hay cursos publicados.</p></section>
</div></ApiState></template>
<style lang="scss" scoped>
.home{display:flex;flex-direction:column;gap:2rem}header small,.event small{font:600 .68rem $font-mono;text-transform:uppercase;color:$lpb-green-deep}header h1{font:400 clamp(2rem,4vw,3rem) $font-display;margin:.2rem 0}header p{font:1rem $font-sans;color:$lpb-muted}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.stats article{display:flex;flex-direction:column;background:$lpb-white;border:1px solid var(--border);border-radius:1rem;padding:1.25rem}.stats b{font:400 2rem $font-display}.stats span{font:.82rem $font-sans;color:$lpb-muted}.event{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.5rem;border-radius:1rem;background:$lpb-green;color:$lpb-black}.event h2{font:400 1.4rem $font-display;margin:.25rem 0}.event p{margin:0;font:.85rem $font-sans}.event>b{padding:.7rem 1rem;background:$lpb-black;color:$lpb-white;border-radius:999px;font:.7rem $font-mono}.heading{display:flex;justify-content:space-between;align-items:center}.heading h2{font:400 1.4rem $font-display}.heading a{font:600 .7rem $font-mono;color:$lpb-green-deep;text-transform:uppercase}.courses{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.courses>a{overflow:hidden;border-radius:1rem;border:1px solid var(--border);background:$lpb-white}.courses img{width:100%;aspect-ratio:16/9;object-fit:cover}.courses div{padding:1rem}.courses h3{font:400 1.1rem $font-display;margin:0}.courses p{font:.82rem $font-sans;color:$lpb-muted}.courses small,.empty{font:.7rem $font-mono;color:$lpb-muted}@media(max-width:720px){.stats,.courses{grid-template-columns:1fr}.event{align-items:flex-start;flex-direction:column}}
</style>
