<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'
import type { CommentUser, LessonComment } from '@/types'

const props = defineProps<{ lessonId: string }>()
const store = useDashboardStore()
const user = useUserStore()
const text = ref('')
const saving = ref(false)
const notice = ref('')
const comments = computed(() => store.commentsByLesson[props.lessonId] || [])
const preview = computed(() => text.value.trim())

function commentUser(comment: LessonComment): CommentUser | null {
  return typeof comment.user === 'string' ? null : comment.user
}

function author(comment: LessonComment) {
  const profile = commentUser(comment)
  return profile ? [profile.name, profile.lastName].filter(Boolean).join(' ') : 'Miembro'
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M'
}

function canDelete(comment: LessonComment) {
  return user.role === 'admin' || (typeof comment.user === 'string' ? comment.user : comment.user._id) === user.id
}

function statusLabel(status: LessonComment['status']) {
  if (status === 'pending') return 'Pendiente de moderación'
  if (status === 'rejected') return 'No publicado'
  return 'Publicado'
}

async function submit() {
  if (!preview.value || saving.value) return
  saving.value = true
  notice.value = ''
  const ok = await store.addComment(props.lessonId, preview.value)
  if (ok) {
    text.value = ''
    notice.value = 'Tu comentario fue enviado y ya puedes verlo. Las demás integrantes lo verán al aprobarse.'
  }
  saving.value = false
}
</script>

<template>
  <section class="comments">
    <header class="comments__header">
      <div><span>Comunidad</span><h2>Comentarios</h2></div>
      <small>{{ comments.length }} {{ comments.length === 1 ? 'comentario' : 'comentarios' }}</small>
    </header>

    <form class="composer" @submit.prevent="submit">
      <label for="lesson-comment">Comparte una pregunta o reflexión</label>
      <textarea id="lesson-comment" v-model="text" rows="4" maxlength="2000" placeholder="Escribe aquí. Verás una vista previa antes de publicar." />
      <div class="composer__footer">
        <small>{{ text.length }} / 2000</small>
        <button type="submit" :disabled="saving || !preview">{{ saving ? 'Publicando...' : 'Publicar comentario' }}</button>
      </div>
    </form>

    <div v-if="preview" class="preview" aria-live="polite">
      <span class="preview__label"><i class="fa-solid fa-eye" aria-hidden="true" /> Así lo verán las demás</span>
      <article class="comment comment--preview">
        <div class="avatar">
          <img v-if="user.profilePicture" :src="user.profilePicture" :alt="user.fullName">
          <span v-else>{{ user.initials }}</span>
        </div>
        <div class="comment__body"><div class="comment__meta"><strong>{{ user.fullName }}</strong><small>Ahora · Pendiente de moderación</small></div><p>{{ preview }}</p></div>
      </article>
    </div>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="!comments.length" class="empty">Sé la primera en comentar esta clase.</p>

    <div v-else class="comment-list">
      <article v-for="comment in comments" :key="comment._id" class="comment">
        <div class="avatar">
          <img v-if="commentUser(comment)?.profilePicture" :src="commentUser(comment)?.profilePicture || ''" :alt="author(comment)">
          <span v-else>{{ initials(author(comment)) }}</span>
        </div>
        <div class="comment__body">
          <div class="comment__meta"><strong>{{ author(comment) }}</strong><small>{{ new Date(comment.createdAt).toLocaleDateString('es-EC') }} · {{ statusLabel(comment.status) }}</small></div>
          <p>{{ comment.body }}</p>
        </div>
        <button v-if="canDelete(comment)" class="delete" type="button" @click="store.removeComment(lessonId, comment._id)">Eliminar</button>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.comments,.comments__header,.composer,.composer__footer,.preview,.comment-list,.comment,.comment__body,.comment__meta,.avatar{display:flex}.comments,.composer,.preview,.comment-list,.comment__body,.comment__meta{flex-direction:column}.comments{gap:1.25rem;padding:1.5rem;border:1px solid rgba($lpb-green-deep,.22);border-radius:1rem;background:$lpb-white}.comments__header{align-items:flex-end;justify-content:space-between;gap:1rem}.comments__header span,.preview__label{color:$lpb-green-deep;font:600 .68rem $font-mono;letter-spacing:.12em;text-transform:uppercase}.comments__header h2{margin:.2rem 0 0;font:400 1.7rem $font-display}.comments__header small,.composer__footer small{color:$lpb-green-deep;font:.7rem $font-mono}.composer{gap:.65rem}.composer label{font:600 .82rem $font-sans}.composer textarea{width:100%;border:1px solid rgba($lpb-green-deep,.35);border-radius:.85rem;padding:1rem;background:$lpb-light;color:$lpb-black;font:.92rem/1.55 $font-sans;resize:vertical}.composer textarea:focus{outline:2px solid rgba($lpb-green,.38);border-color:$lpb-green-deep}.composer__footer{align-items:center;justify-content:space-between;gap:1rem}.composer button{padding:.75rem 1rem;border:0;border-radius:999px;background:$lpb-black;color:$lpb-white;font:600 .7rem $font-mono;text-transform:uppercase}.composer button:disabled{opacity:.45;cursor:not-allowed}.preview{gap:.65rem;padding:1rem;border:1px dashed $lpb-green;border-radius:1rem;background:$lpb-surface}.preview__label{display:flex;align-items:center;gap:.45rem}.comment-list{gap:.75rem}.comment{position:relative;flex-direction:row;align-items:flex-start;gap:.85rem;padding:1rem;border:1px solid rgba($lpb-green-deep,.16);border-radius:.9rem;background:$lpb-white}.comment--preview{background:$lpb-light}.avatar{flex:0 0 42px;width:42px;height:42px;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba($lpb-green-deep,.22);border-radius:50%;background:$lpb-black;color:$lpb-green;font:700 .72rem $font-mono}.avatar img{width:100%;height:100%;object-fit:cover}.comment__body{flex:1;min-width:0;gap:.45rem}.comment__meta{gap:.15rem}.comment__meta strong{font:600 .88rem $font-sans}.comment__meta small{color:$lpb-green-deep;font:.64rem $font-mono}.comment p{margin:0;color:$lpb-black;font:.9rem/1.55 $font-sans;white-space:pre-wrap;overflow-wrap:anywhere}.delete{align-self:flex-start;border:0;background:transparent;color:$alert-error;font:600 .63rem $font-mono;text-transform:uppercase}.notice,.empty{margin:0;padding:.8rem 1rem;border-radius:.75rem;background:$lpb-light;color:$lpb-green-deep;font:.8rem/1.45 $font-sans}@media(max-width:640px){.comments{padding:1rem}.comments__header{align-items:flex-start;flex-direction:column}.composer__footer{align-items:stretch;flex-direction:column}.composer button{width:100%}.comment{flex-wrap:wrap}.delete{margin-left:52px}}
</style>
