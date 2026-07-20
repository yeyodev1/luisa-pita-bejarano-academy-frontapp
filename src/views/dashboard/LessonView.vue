<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'
import ApiState from '@/components/ui/ApiState.vue'
import LessonVideoPlayer from '@/components/dashboard/LessonVideoPlayer.vue'
const route=useRoute(); const store=useDashboardStore(); const user=useUserStore(); const text=ref(''); const saving=ref(false)
const lessonId=computed(()=>String(route.params.lessonId)); const comments=computed(()=>store.commentsByLesson[lessonId.value]||[])
async function load(){await Promise.all([store.fetchLesson(lessonId.value),store.fetchComments(lessonId.value)])}
onMounted(load); watch(lessonId,load)
async function progress(watched:number,position:number,duration:number){try{await store.saveProgress(lessonId.value,watched,position,duration)}catch{}}
async function toggleComplete(){const lesson=store.currentLesson;if(!lesson)return;const complete=!lesson.progress?.completed;await store.saveProgress(lesson._id,lesson.progress?.watchedSeconds||0,lesson.progress?.lastPositionSeconds||0,lesson.durationSeconds,complete)}
async function submit(){if(!text.value.trim())return;saving.value=true;const ok=await store.addComment(lessonId.value,text.value.trim());if(ok)text.value='';saving.value=false}
function author(comment:typeof comments.value[number]){return typeof comment.user==='string'?'Miembro':[comment.user.name,comment.user.lastName].filter(Boolean).join(' ')}
function canDelete(comment:typeof comments.value[number]){return user.role==='admin'||(typeof comment.user==='string'?comment.user:comment.user._id)===user.id}
</script>
<template><ApiState :loading="store.loading&&!store.currentLesson" :error="store.error" :empty="!store.currentLesson" empty-text="Clase no encontrada." @retry="load"><div v-if="store.currentLesson" class="lesson">
  <nav><RouterLink :to="{name:'courses'}">Cursos</RouterLink><span>/</span><RouterLink :to="{name:'course-detail',params:{slug:route.params.slug}}">Curso</RouterLink><span>/</span>{{store.currentLesson.title}}</nav>
  <LessonVideoPlayer v-if="store.currentLesson.video" :key="lessonId" :asset="store.currentLesson.video" :resume-at="store.currentLesson.progress?.lastPositionSeconds" :watched-seconds="store.currentLesson.progress?.watchedSeconds" @progress="progress"/>
  <section v-else class="empty">Esta clase todavía no tiene video.</section>
  <section class="meta"><div><h1>{{store.currentLesson.title}}</h1><p>{{store.currentLesson.content || store.currentLesson.summary}}</p><a v-for="material in store.currentLesson.materials" :key="material.publicId" :href="material.deliveryUrl" target="_blank" rel="noopener">{{material.title}}</a></div><button type="button" @click="toggleComplete">{{store.currentLesson.progress?.completed?'Marcar pendiente':'Marcar completada'}}</button></section>
  <section class="comments"><h2>Comentarios</h2><form @submit.prevent="submit"><textarea v-model="text" rows="3" maxlength="2000" placeholder="Comparte una pregunta o reflexión..."/><button :disabled="saving">{{saving?'Publicando...':'Comentar'}}</button></form><p v-if="!comments.length" class="empty">Sé la primera en comentar esta clase.</p><article v-for="comment in comments" :key="comment._id"><strong>{{author(comment)}}</strong><small>{{new Date(comment.createdAt).toLocaleDateString('es-EC')}} · {{comment.status==='pending'?'Pendiente de moderación':comment.status}}</small><button v-if="canDelete(comment)" class="delete" type="button" @click="store.removeComment(lessonId,comment._id)">Eliminar</button><p>{{comment.body}}</p></article></section>
</div></ApiState></template>
<style lang="scss" scoped>
.lesson{display:flex;flex-direction:column;gap:1.4rem}nav{display:flex;gap:.5rem;overflow:hidden;font:.8rem $font-sans;color:$lpb-muted;white-space:nowrap}nav a{color:$lpb-green-deep}.meta,.comments{background:$lpb-white;border:1px solid var(--border);border-radius:1rem;padding:1.5rem}.meta{display:flex;justify-content:space-between;gap:1.5rem}.meta h1,.comments h2{font:400 1.5rem $font-display;margin:0}.meta p,.comments p{font:.92rem/1.55 $font-sans;color:$lpb-graphite}.meta a{font:600 .7rem $font-mono;color:$lpb-green-deep;text-transform:uppercase}.meta button,.comments button{align-self:flex-start;padding:.75rem 1rem;border-radius:999px;background:$lpb-black;color:$lpb-white;font:600 .7rem $font-mono;text-transform:uppercase;white-space:nowrap}.comments form{display:flex;gap:.75rem;align-items:flex-end;margin:1rem 0}.comments textarea{flex:1;border:1px solid var(--border);border-radius:.75rem;padding:.85rem;background:$lpb-cream;font:.9rem $font-sans;resize:vertical}.comments article{padding:1rem 0;border-top:1px solid var(--border)}.comments article strong{font:600 .88rem $font-sans}.comments article small{margin-left:.5rem;color:$lpb-muted;font:.65rem $font-mono}.comments article p{margin:.4rem 0}.comments .delete{float:right;background:transparent;color:$alert-error;padding:.2rem;border-radius:0}.empty{color:$lpb-muted!important}@media(max-width:640px){.meta,.comments form{flex-direction:column}.comments form button{align-self:stretch}.meta{padding:1rem}}
</style>
