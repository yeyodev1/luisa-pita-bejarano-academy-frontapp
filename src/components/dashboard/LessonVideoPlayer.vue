<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { videoPlayer, type VideoPlayer } from 'cloudinary-video-player'
import 'cloudinary-video-player/cld-video-player.min.css'
import { contentService } from '@/services/contentService'
import type { MediaAsset } from '@/types'

const props = defineProps<{ asset: MediaAsset; resumeAt?: number; watchedSeconds?: number }>()
const emit = defineEmits<{ progress: [watched: number, position: number, duration: number] }>()
const elementId = `lesson-player-${Math.random().toString(36).slice(2)}`
const error = ref('')
let player: VideoPlayer | null = null
let watched = props.watchedSeconds || 0
let lastSent = watched
let previousPosition = props.resumeAt || 0

function values() {
  const position = Number(player?.currentTime() || 0)
  const duration = Number(player?.duration() || 0)
  return { watched, position, duration }
}

function persist(force = false) {
  const data = values()
  if (!data.duration || (!force && data.watched - lastSent < 15)) return
  lastSent = data.watched
  emit('progress', data.watched, data.position, data.duration)
}

function trackPlayback() {
  const position = Number(player?.currentTime() || 0)
  const delta = position - previousPosition
  if (delta > 0 && delta <= 2) watched += delta
  previousPosition = position
  persist(false)
}

onMounted(async () => {
  try {
    const delivery = (await contentService.getAssetDelivery(props.asset)).data.data
    player = videoPlayer(elementId, { cloud_name: delivery.cloudName, controls: true, fluid: true })
    const eventPlayer = player as VideoPlayer & {
      src: (source: { src: string; type: string }) => void
      on: (name: string, callback: () => void) => void
    }
    // Delivery URLs are already signed by the backend, so bypass public-id URL generation.
    eventPlayer.src({ src: delivery.url, type: `video/${props.asset.format || 'mp4'}` })
    eventPlayer.on('loadedmetadata', () => {
      if (props.resumeAt) player?.currentTime(props.resumeAt)
      previousPosition = props.resumeAt || 0
    })
    eventPlayer.on('timeupdate', trackPlayback)
    eventPlayer.on('seeking', () => { previousPosition = Number(player?.currentTime() || 0) })
    eventPlayer.on('pause', () => persist(true))
    eventPlayer.on('ended', () => persist(true))
  } catch (loadError) {
    error.value = (loadError as { message?: string }).message || 'No se pudo cargar el video.'
  }
})

onBeforeUnmount(() => { persist(true); player?.dispose() })
</script>

<template>
  <div class="lesson-player">
    <video :id="elementId" class="cld-video-player cld-fluid" playsinline />
    <p v-if="error" class="lesson-player__error">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.lesson-player { overflow: hidden; border-radius: 1rem; background: $lpb-black; min-height: 200px; }
.lesson-player__error { color: $lpb-white; padding: 2rem; text-align: center; font-family: $font-sans; }
</style>
