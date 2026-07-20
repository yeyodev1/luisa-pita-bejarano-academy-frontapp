<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { videoPlayer, type VideoPlayer } from 'cloudinary-video-player'
import 'cloudinary-video-player/cld-video-player.min.css'
import { contentService } from '@/services/contentService'
import type { MediaAsset } from '@/types'

const props = defineProps<{ asset: MediaAsset; resumeAt?: number; watchedSeconds?: number }>()
const emit = defineEmits<{ progress: [watched: number, position: number, duration: number] }>()
const elementId = `lesson-player-${Math.random().toString(36).slice(2)}`
const bunnyElement = ref<HTMLIFrameElement | null>(null)
const bunnyUrl = ref('')
const error = ref('')
const loading = ref(true)
let cloudinaryPlayer: VideoPlayer | null = null
let bunnyPlayer: BunnyPlayer | null = null
let bunnyPosition = props.resumeAt || 0
let bunnyDuration = 0
let watched = props.watchedSeconds || 0
let lastSent = watched
let previousPosition = props.resumeAt || 0

function currentTime() { return cloudinaryPlayer ? Number(cloudinaryPlayer.currentTime() || 0) : bunnyPosition }
function duration() { return cloudinaryPlayer ? Number(cloudinaryPlayer.duration() || 0) : bunnyDuration }

function persist(force = false) {
  const videoDuration = duration()
  if (!videoDuration || (!force && watched - lastSent < 15)) return
  lastSent = watched
  emit('progress', watched, currentTime(), videoDuration)
}

function trackPlayback() {
  const position = currentTime()
  const delta = position - previousPosition
  if (delta > 0 && delta <= 2) watched += delta
  previousPosition = position
  persist(false)
}

async function mountBunny() {
  const delivery = props.asset.deliveryUrl
    ? { url: props.asset.deliveryUrl }
    : (await contentService.getAssetDelivery(props.asset)).data.data
  bunnyUrl.value = delivery.url
}

function connectBunnyPlayer() {
  if (!bunnyUrl.value || bunnyPlayer) return
  loading.value = false
  const element = bunnyElement.value
  const Player = window.playerjs?.Player
  if (!element || !Player) {
    error.value = 'No se pudo iniciar el reproductor de Bunny.'
    return
  }
  bunnyPlayer = new Player(element)
  bunnyPlayer.on('ready', () => {
    if (props.resumeAt) bunnyPlayer?.setCurrentTime(props.resumeAt)
    previousPosition = props.resumeAt || 0
  })
  bunnyPlayer.on('timeupdate', (data) => {
    bunnyPosition = Number(data?.seconds || 0)
    bunnyDuration = Number(data?.duration || 0)
    trackPlayback()
  })
  bunnyPlayer.on('seeked', () => { previousPosition = bunnyPosition })
  bunnyPlayer.on('pause', () => persist(true))
  bunnyPlayer.on('ended', () => persist(true))
  bunnyPlayer.on('error', () => {
    loading.value = false
    error.value = 'No se pudo reproducir el video.'
  })
}

async function mountCloudinary() {
  const delivery = (await contentService.getAssetDelivery(props.asset)).data.data
  cloudinaryPlayer = videoPlayer(elementId, { cloud_name: delivery.cloudName, controls: true, fluid: true })
  const eventPlayer = cloudinaryPlayer as VideoPlayer & {
    src: (source: { src: string; type: string }) => void
    on: (name: string, callback: () => void) => void
  }
  eventPlayer.src({ src: delivery.url, type: `video/${props.asset.format || 'mp4'}` })
  eventPlayer.on('loadedmetadata', () => {
    loading.value = false
    if (props.resumeAt) cloudinaryPlayer?.currentTime(props.resumeAt)
    previousPosition = props.resumeAt || 0
  })
  eventPlayer.on('timeupdate', trackPlayback)
  eventPlayer.on('seeking', () => { previousPosition = currentTime() })
  eventPlayer.on('pause', () => persist(true))
  eventPlayer.on('ended', () => persist(true))
}

onMounted(async () => {
  try {
    if (props.asset.provider === 'bunny') await mountBunny()
    else await mountCloudinary()
  } catch (loadError) {
    loading.value = false
    error.value = (loadError as { message?: string }).message || 'No se pudo cargar el video.'
  }
})

onBeforeUnmount(() => { persist(true); bunnyPlayer?.off(); cloudinaryPlayer?.dispose() })
</script>

<template>
  <div class="lesson-player">
    <div class="lesson-player__bar">
      <strong>Academia LPB</strong>
      <span><i class="fa-solid fa-lock" aria-hidden="true" /> Video seguro</span>
    </div>
    <div class="lesson-player__stage">
      <iframe
      v-if="asset.provider === 'bunny'"
      ref="bunnyElement"
      :src="bunnyUrl"
      title="Video de la clase"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      @load="connectBunnyPlayer"
      />
      <video v-else :id="elementId" class="cld-video-player cld-fluid" playsinline />
      <div v-if="loading" class="lesson-player__loading" role="status">
        <i class="fa-solid fa-circle-play" aria-hidden="true" />
        <span>Preparando tu clase</span>
      </div>
      <p v-if="error" class="lesson-player__error">{{ error }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lesson-player { display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba($lpb-green, .7); border-radius: 1rem; background: $lpb-black; min-height: 200px; box-shadow: 0 1rem 2.5rem rgba($lpb-black, .24); }
.lesson-player__bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .7rem 1rem; background: $lpb-black; color: $lpb-white; font-family: $font-mono; text-transform: uppercase; }
.lesson-player__bar strong { color: $lpb-green; font-size: .72rem; letter-spacing: .12em; }
.lesson-player__bar span { display: flex; align-items: center; gap: .4rem; font-size: .62rem; letter-spacing: .08em; }
.lesson-player__stage { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 16 / 9; background: $lpb-black; }
.lesson-player iframe, .lesson-player video { display: flex; width: 100%; height: 100%; border: 0; }
.lesson-player__loading, .lesson-player__error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: .75rem; margin: 0; padding: 2rem; background: $lpb-black; color: $lpb-white; text-align: center; font-family: $font-sans; }
.lesson-player__loading i { color: $lpb-green; font-size: 2.5rem; animation: player-pulse 1.4s ease-in-out infinite; }
.lesson-player__error { color: $lpb-white; }
@keyframes player-pulse { 50% { opacity: .45; transform: scale(.92); } }
@media (max-width: 560px) { .lesson-player__bar { padding: .6rem .75rem; } .lesson-player__bar span { font-size: .56rem; } }
</style>
