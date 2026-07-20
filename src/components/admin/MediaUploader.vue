<script setup lang="ts">
import { ref } from 'vue'
import { adminContentService } from '@/services/adminContentService'
import type { AssetCategory } from '@/services/adminContentService'
import type { MediaAsset, ResourceType } from '@/types'

const props = withDefaults(defineProps<{ resourceType: ResourceType; category: AssetCategory; label?: string }>(), { label: 'Subir archivo' })
const emit = defineEmits<{ uploaded: [asset: MediaAsset] }>()
const busy = ref(false)
const error = ref('')

interface UploadResult { event: string; info?: { public_id: string; resource_type: string } }

async function openWidget() {
  const cloudinary = window.cloudinary
  if (!cloudinary?.createUploadWidget) {
    error.value = 'No se pudo cargar el widget de Cloudinary.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const signature = (await adminContentService.mediaSignature(props.resourceType, props.category)).data.data
    const widget = cloudinary.createUploadWidget({
      cloudName: signature.cloudName,
      apiKey: signature.apiKey,
      uploadSignature: signature.params.signature,
      uploadSignatureTimestamp: signature.params.timestamp,
      folder: signature.params.folder,
      type: signature.params.type,
      resourceType: signature.resourceType,
      multiple: false,
      sources: ['local'],
    }, async (widgetError: unknown, result: UploadResult) => {
      if (widgetError) { error.value = 'La carga no pudo completarse.'; busy.value = false; return }
      if (result.event === 'close') busy.value = false
      if (result.event !== 'success' || !result.info) return
      try {
        const confirmed = await adminContentService.confirmMedia(
          result.info.public_id,
          result.info.resource_type as ResourceType,
        )
        emit('uploaded', confirmed.data.data.asset)
        widget.close()
      } catch (confirmError) {
        error.value = (confirmError as { message?: string }).message || 'No se pudo verificar el archivo.'
      } finally {
        busy.value = false
      }
    })
    widget.open()
  } catch (uploadError) {
    error.value = (uploadError as { message?: string }).message || 'No se pudo iniciar la carga.'
    busy.value = false
  }
}
</script>

<template>
  <div class="media-upload">
    <button type="button" :disabled="busy" @click="openWidget">{{ busy ? 'Preparando...' : label }}</button>
    <small v-if="error">{{ error }}</small>
  </div>
</template>

<style lang="scss" scoped>
.media-upload { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
button { border: 1px solid var(--border); border-radius: 999px; padding: .65rem 1rem; background: $lpb-white; color: $lpb-black; font: 600 .7rem $font-mono; text-transform: uppercase; cursor: pointer; }
button:disabled { opacity: .5; }
small { color: $alert-error; font-family: $font-sans; }
</style>
