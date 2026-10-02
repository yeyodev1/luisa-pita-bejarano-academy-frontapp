<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload } from 'tus-js-client'
import { adminContentService } from '@/services/adminContentService'
import type { AssetCategory } from '@/services/adminContentService'
import type { MediaAsset, ResourceType } from '@/types'

const props = withDefaults(defineProps<{ resourceType: ResourceType; category: AssetCategory; label?: string }>(), { label: 'Subir archivo' })
const emit = defineEmits<{ uploaded: [asset: MediaAsset]; busy: [value: boolean] }>()
const busy = ref(false)
// Avisa al padre si hay una subida en curso (para no guardar ni cerrar a medias).
watch(busy, (value) => emit('busy', value))

/** Fallos seguidos al consultar el estado antes de rendirse (cortes de red). */
const MAX_POLL_FAILURES = 6

function friendlyError(err: unknown, fallback: string) {
  const message = (err as { message?: string })?.message
  if (!message || message === 'Unknown error') return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
  return message || fallback
}
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
    let failures = 0
    while (Date.now() < deadline) {
      try {
        const video = (await adminContentService.getVideoStatus(videoId)).data.data
        failures = 0
        progress.value = video.encodeProgress
        if (video.status === 4 || video.status === 8) break
        if (video.status === 5 || video.status === 6) throw new Error('No se pudo procesar el video. Revisa que el archivo no esté dañado e intenta con otro.')
      } catch (pollError) {
        // Un corte momentáneo no debe borrar un video ya subido: se reintenta.
        if (pollError instanceof Error && pollError.message.startsWith('No se pudo procesar')) throw pollError
        failures += 1
        if (failures >= MAX_POLL_FAILURES) throw new Error('Perdimos la conexión mientras se procesaba el video. Revisa tu internet e intenta de nuevo.')
      }
      await new Promise((resolve) => window.setTimeout(resolve, 5000 * Math.min(failures + 1, 4)))
    }
    if (Date.now() >= deadline) throw new Error('El video sigue procesándose después de 30 minutos. Intenta de nuevo más tarde.')
    const confirmed = await adminContentService.confirmVideoUpload(videoId, {
      bytes: file.size,
      duration,
      originalFilename: file.name,
    })
    emit('uploaded', confirmed.data.data.asset)
  } catch (uploadError) {
    error.value = friendlyError(uploadError, 'La carga no pudo completarse.')
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
  if (!cloudinary?.createUploadWidget) { error.value = 'No se pudo abrir el cargador de archivos. Desactiva el bloqueador de anuncios o recarga la página.'; return }
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
        error.value = friendlyError(confirmError, 'No se pudo verificar el archivo.')
      } finally { busy.value = false }
    })
    widget.open()
  } catch (uploadError) {
    error.value = friendlyError(uploadError, 'No se pudo iniciar la carga.')
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
    <p v-if="busy && resourceType === 'video'" class="media-upload__note">
      <i class="fa-solid fa-circle-info" /> {{ processing ? 'Procesando el video: puede tardar varios minutos.' : 'Subiendo el video.' }}
      No cierres esta ventana.
    </p>
    <p v-if="error" class="media-upload__error" role="alert"><i class="fa-solid fa-triangle-exclamation" /> {{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.media-upload { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
button { border: 1px solid var(--border); border-radius: 999px; padding: .65rem 1rem; background: $lpb-white; color: $lpb-black; font: 600 .7rem $font-mono; text-transform: uppercase; cursor: pointer; }
button:disabled { opacity: .5; }
progress { width: min(12rem, 100%); accent-color: $lpb-green; }
.media-upload__note, .media-upload__error { flex-basis: 100%; margin: 0; font: 0.75rem/1.45 $font-sans; }
.media-upload__note { color: $lpb-graphite; }
.media-upload__error { padding: 0.55rem 0.75rem; border-radius: 0.6rem; background: rgba($alert-error, 0.08); color: $alert-error; }
</style>
