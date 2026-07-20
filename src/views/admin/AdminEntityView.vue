<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { adminContentService, type AssetCategory, type ContentKind } from '@/services/adminContentService'
import ApiState from '@/components/ui/ApiState.vue'
import MediaUploader from '@/components/admin/MediaUploader.vue'
import type { LessonComment, MediaAsset } from '@/types'

type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'datetime-local' | 'select'; required?: boolean; list?: boolean; options?: Array<{ value: string; label: string }> }
const props = defineProps<{ kind: ContentKind; title: string; fields: Field[]; readonly?: boolean; assetField?: 'cover' | 'icon'; assetCategory?: AssetCategory }>()
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const editing = ref<Record<string, unknown> | null>(null)
const form = reactive<Record<string, string>>({})
const asset = ref<MediaAsset>()
const originalAsset = ref<MediaAsset>()
const assetRemoved = ref(false)
const calendarDefaults = ref({ timezone: 'UTC', meetingUrl: '' })
const heading = computed(() => editing.value ? `Editar ${props.title.toLowerCase()}` : `Nuevo ${props.title.toLowerCase()}`)
const idOf = (item: Record<string, unknown>) => String(item._id)

function localDate(value: unknown) {
  if (!value) return ''
  const date = new Date(String(value))
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function reset() {
  editing.value = null
  asset.value = undefined
  originalAsset.value = undefined
  assetRemoved.value = false
  Object.keys(form).forEach((key) => delete form[key])
  props.fields.forEach((field) => {
    form[field.key] = field.key === 'status' ? 'draft' : field.key === 'timezone' ? calendarDefaults.value.timezone : field.key === 'meetingUrl' ? calendarDefaults.value.meetingUrl : ''
  })
}

function edit(item: Record<string, unknown>) {
  editing.value = item
  asset.value = props.assetField ? item[props.assetField] as MediaAsset | undefined : undefined
  originalAsset.value = asset.value
  assetRemoved.value = false
  props.fields.forEach((field) => {
    const value = item[field.key]
    form[field.key] = field.list ? ((value as string[]) || []).join('\n') : field.type === 'datetime-local' ? localDate(value) : String(value ?? '')
  })
}

function payload() {
  const result: Record<string, unknown> = Object.fromEntries(props.fields.map((field) => [
    field.key,
    field.list ? String(form[field.key] || '').split('\n').map((value) => value.trim()).filter(Boolean) : field.type === 'datetime-local' && form[field.key] ? new Date(form[field.key] as string).toISOString() : form[field.key],
  ]))
  if (!result.slug) delete result.slug
  props.fields.forEach((field) => {
    if (field.type === 'number' && result[field.key] === '') delete result[field.key]
    if (field.type === 'datetime-local' && result[field.key] === '') {
      if (editing.value && field.key === 'endsAt') result[field.key] = null
      else delete result[field.key]
    }
  })
  if (props.assetField && asset.value) result[props.assetField] = asset.value
  if (props.assetField && assetRemoved.value) result[props.assetField] = null
  return result
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await adminContentService.list<Record<string, unknown>>(props.kind)
    if (props.kind === 'calendar' && !editing.value) {
      const config = (await adminContentService.getCalendarConfig()).data.data
      calendarDefaults.value = { timezone: config.defaultTimezone, meetingUrl: config.defaultMeetingUrl }
      form.timezone = config.defaultTimezone
      form.meetingUrl = config.defaultMeetingUrl
    }
  }
  catch (loadError) { error.value = (loadError as { message?: string }).message || 'No se pudo cargar.' }
  finally { loading.value = false }
}

async function save() {
  if (props.kind === 'comments') return
  loading.value = true
  try {
    const previousAsset = originalAsset.value
    if (editing.value) await adminContentService.update(props.kind, idOf(editing.value), payload())
    else await adminContentService.create(props.kind, payload())
    if (previousAsset && previousAsset.publicId !== asset.value?.publicId) {
      await adminContentService.deleteMedia(previousAsset.publicId, previousAsset.resourceType, previousAsset.provider).catch(() => undefined)
    }
    reset()
    await load()
  } catch (saveError) {
    error.value = (saveError as { message?: string }).message || 'No se pudo guardar.'
    loading.value = false
  }
}

async function remove(item: Record<string, unknown>) {
  if (!confirm('¿Eliminar este registro?')) return
  await adminContentService.remove(props.kind, idOf(item))
  await load()
}

async function moderate(item: Record<string, unknown>, status: LessonComment['status']) {
  await adminContentService.moderateComment(idOf(item), status)
  await load()
}

async function award(item: Record<string, unknown>) {
  const userId = prompt('ID del usuario que recibirá el logro')?.trim()
  if (!userId) return
  const notes = prompt('Notas opcionales')?.trim() || ''
  await adminContentService.awardAchievement(idOf(item), userId, notes)
}

async function revoke(item: Record<string, unknown>) {
  const userId = prompt('ID del usuario al que se revocará el logro')?.trim()
  if (userId) await adminContentService.revokeAchievement(idOf(item), userId)
}

async function deleteAsset() {
  if (!asset.value || !confirm('¿Eliminar este archivo de Cloudinary?')) return
  if (asset.value.publicId !== originalAsset.value?.publicId) {
    await adminContentService.deleteMedia(asset.value.publicId, asset.value.resourceType, asset.value.provider)
  }
  asset.value = undefined
  assetRemoved.value = true
}

function itemTitle(item: Record<string, unknown>) {
  return String(item.title || item.body || 'Sin título')
}

function itemMeta(item: Record<string, unknown>) {
  return String(item.status || item.startsAt || item.createdAt || item.summary || '')
}

onMounted(() => { reset(); load() })
watch(() => props.kind, () => { reset(); load() })
</script>

<template>
  <div class="entity"><div class="entity__top"><div><h2>{{ title }}</h2><p>{{ items.length }} registros</p></div><button v-if="!readonly" @click="reset">Nuevo</button></div>
    <ApiState :loading="loading&&!items.length" :error="error" :empty="!items.length" @retry="load">
      <div class="entity__layout"><div class="list"><article v-for="item in items" :key="idOf(item)"><div><strong>{{ itemTitle(item) }}</strong><small>{{ itemMeta(item) }}</small></div><span>
        <template v-if="kind==='comments'"><button @click="moderate(item,'published')">Publicar</button><button @click="moderate(item,'rejected')">Rechazar</button><button @click="moderate(item,'pending')">Pendiente</button></template>
        <template v-if="kind==='achievements'"><button @click="award(item)">Otorgar</button><button @click="revoke(item)">Revocar</button></template>
        <button v-if="!readonly" @click="edit(item)">Editar</button><button class="danger" @click="remove(item)">Eliminar</button>
      </span></article></div>
      <form v-if="!readonly" class="editor" @submit.prevent="save"><h3>{{ heading }}</h3><label v-for="field in fields" :key="field.key"><span>{{ field.label }}</span><textarea v-if="field.type==='textarea'" v-model="form[field.key]" :rows="field.list?5:3" :required="field.required"/><select v-else-if="field.type==='select'" v-model="form[field.key]" :required="field.required"><option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option></select><input v-else v-model="form[field.key]" :type="field.type||'text'" :required="field.required"></label>
        <div v-if="assetField&&assetCategory"><MediaUploader resource-type="image" :category="assetCategory" :label="assetField==='icon'?'Subir icono':'Subir portada'" @uploaded="asset=$event"/><button v-if="asset" type="button" class="danger" @click="deleteAsset">Eliminar archivo</button></div>
        <div class="actions"><button type="button" @click="reset">Limpiar</button><button class="primary" type="submit">Guardar</button></div>
      </form></div>
    </ApiState>
  </div>
</template>

<style lang="scss" scoped>
.entity{display:flex;flex-direction:column;gap:1rem}.entity__top{display:flex;justify-content:space-between;align-items:center}.entity h2{font:400 1.6rem $font-display;margin:0}.entity__top p{font:.75rem $font-mono;color:$lpb-muted}.entity button{padding:.6rem .8rem;border:1px solid var(--border);border-radius:999px;background:$lpb-white;font:600 .66rem $font-mono;text-transform:uppercase}.entity__top>button,.primary{background:$lpb-black!important;color:$lpb-white}.entity__layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(300px,.7fr);gap:1rem}.list,.editor{background:$lpb-white;border:1px solid var(--border);border-radius:1rem;padding:1rem}.list article{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.85rem 0;border-bottom:1px solid var(--border)}.list article:last-child{border:0}.list article>div{display:flex;flex-direction:column;gap:.2rem}.list strong{font:600 .9rem $font-sans}.list small{max-width:460px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:.68rem $font-mono;color:$lpb-muted}.list article>span{display:flex;gap:.3rem;flex-wrap:wrap}.danger{color:$alert-error!important}.editor{display:flex;flex-direction:column;gap:.8rem;align-self:start;position:sticky;top:100px}.editor h3{font:400 1.2rem $font-display;margin:0}.editor label{display:flex;flex-direction:column;gap:.3rem}.editor label>span{font:600 .66rem $font-mono;text-transform:uppercase;color:$lpb-muted}.editor input,.editor textarea,.editor select{width:100%;border:1px solid var(--border);border-radius:.6rem;padding:.7rem;background:$lpb-cream;font:.85rem $font-sans}.actions{display:flex;justify-content:flex-end;gap:.5rem}@media(max-width:900px){.entity__layout{grid-template-columns:1fr}.editor{position:static;grid-row:1}.list article{align-items:flex-start;flex-direction:column}}
</style>
