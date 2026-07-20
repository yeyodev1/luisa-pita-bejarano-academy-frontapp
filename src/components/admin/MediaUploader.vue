<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'tus-js-client'
import { adminContentService } from '@/services/adminContentService'
import type { AssetCategory } from '@/services/adminContentService'
import type { MediaAsset, ResourceType } from '@/types'

const props = withDefaults(defineProps<{ resourceType: ResourceType; category: AssetCategory; label?: string }>(), { label: 'Subir archivo' })
const emit = defineEmits<{ uploaded: [asset: MediaAsset] }>()
const busy = ref(false)
const error = ref('')
const progress = ref(0)
const processing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

interface UploadResult { event: string; info?: { public_id: string; resource_type: string } }

function videoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const element = document.createElement('video')
    const url = URL.createObjectURL(file)
    element.preload = 'metadata'
    element.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number(element.duration) || 0) }
    element.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    element.src = url
  })
}

async function uploadVideo(file: File) {
  busy.value = true
  error.value = ''
  progress.value = 0
  let videoId = ''
  try {
    const duration = await videoDuration(file)
    const credentials = (await adminContentService.createVideoUpload(file.name)).data.data
    videoId = credentials.videoId
    await new Promise<void>((resolve, reject) => {
      const upload = new Upload(file, {
        endpoint: credentials.uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
        headers: {
          AuthorizationSignature: credentials.signature,
          AuthorizationExpire: String(credentials.expirationTime),
          LibraryId: credentials.libraryId,
          VideoId: credentials.videoId,
        },
        metadata: { filetype: file.type || 'video/mp4', title: file.name },
        removeFingerprintOnSuccess: true,
        onProgress: (uploaded, total) => { progress.value = total ? Math.round((uploaded * 100) / total) : 0 },
        onError: reject,
        onSuccess: () => resolve(),
      })
      upload.start()
    })
    processing.value = true
    const deadline = Date.now() + 30 * 60 * 1000
    while (Date.now() < deadline) {
      const video = (await adminContentService.getVideoStatus(videoId)).data.data
      progress.value = video.encodeProgress
      if (video.status === 4 || video.status === 8) break
      if (video.status === 5 || video.status === 6) throw new Error('Bunny no pudo procesar el video.')
      await new Promise((resolve) => window.setTimeout(resolve, 5000))
    }
    if (Date.now() >= deadline) throw new Error('Bunny continúa procesando el video. Intenta nuevamente más tarde.')
    const confirmed = await adminContentService.confirmVideoUpload(videoId, {
      bytes: file.size,
      duration,
      originalFilename: file.name,
    })
    emit('uploaded', confirmed.data.data.asset)
  } catch (uploadError) {
    error.value = (uploadError as { message?: string }).message || 'La carga no pudo completarse.'
    if (videoId) await adminContentService.deleteMedia(videoId, 'video', 'bunny').catch(() => undefined)
  } finally {
    busy.value = false
    processing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function openWidget() {
  if (props.resourceType === 'video') { fileInput.value?.click(); return }
  const cloudinary = window.cloudinary
  if (!cloudinary?.createUploadWidget) { error.value = 'No se pudo cargar el widget de Cloudinary.'; return }
  busy.value = true
  error.value = ''
  try {
    const signature = (await adminContentService.mediaSignature(props.resourceType, props.category)).data.data
    const widget = cloudinary.createUploadWidget({
      cloudName: signature.cloudName, apiKey: signature.apiKey,
      uploadSignature: signature.params.signature, uploadSignatureTimestamp: signature.params.timestamp,
      folder: signature.params.folder, type: signature.params.type, resourceType: signature.resourceType,
      multiple: false, sources: ['local'],
    }, async (widgetError: unknown, result: UploadResult) => {
      if (widgetError) { error.value = 'La carga no pudo completarse.'; busy.value = false; return }
      if (result.event === 'close') busy.value = false
      if (result.event !== 'success' || !result.info) return
      try {
        const confirmed = await adminContentService.confirmMedia(result.info.public_id, result.info.resource_type as ResourceType)
        emit('uploaded', confirmed.data.data.asset)
        widget.close()
      } catch (confirmError) {
        error.value = (confirmError as { message?: string }).message || 'No se pudo verificar el archivo.'
      } finally { busy.value = false }
    })
    widget.open()
  } catch (uploadError) {
    error.value = (uploadError as { message?: string }).message || 'No se pudo iniciar la carga.'
    busy.value = false
  }
}

function selectVideo(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void uploadVideo(file)
}
</script>

<template>
  <div class="media-upload">
    <input v-if="resourceType === 'video'" ref="fileInput" type="file" accept="video/*" hidden @change="selectVideo">
    <button type="button" :disabled="busy" @click="openWidget">
      {{ busy ? (resourceType === 'video' ? `${processing ? 'Procesando' : 'Subiendo'} ${progress}%` : 'Preparando...') : label }}
    </button>
    <progress v-if="busy && resourceType === 'video'" :value="progress" max="100" />
    <small v-if="error">{{ error }}</small>
  </div>
</template>

<style lang="scss" scoped>
.media-upload { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
button { border: 1px solid var(--border); border-radius: 999px; padding: .65rem 1rem; background: $lpb-white; color: $lpb-black; font: 600 .7rem $font-mono; text-transform: uppercase; cursor: pointer; }
button:disabled { opacity: .5; }
progress { width: min(12rem, 100%); accent-color: $lpb-green; }
small { color: $alert-error; font-family: $font-sans; }
</style>
