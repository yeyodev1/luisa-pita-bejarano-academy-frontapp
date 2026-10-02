<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  backofficeService,
  type AdminRequest,
  type BillingPeriod,
  type RequestStatus,
  type TechService,
  type TechServiceStatus,
} from '@/services/backofficeService'

type Tab = 'requests' | 'services'
const TAB_KEY = 'admin-backoffice-tab'

function initialTab(): Tab {
  try {
    return localStorage.getItem(TAB_KEY) === 'services' ? 'services' : 'requests'
  } catch {
    return 'requests'
  }
}

const tab = ref<Tab>(initialTab())
function setTab(value: Tab) {
  tab.value = value
  try {
    localStorage.setItem(TAB_KEY, value)
  } catch {
    // Solo es una preferencia; si el navegador no deja guardar, no pasa nada.
  }
}

const error = ref('')
const success = ref('')
function fail(e: unknown, fallback: string) {
  error.value = (e as { message?: string })?.message || fallback
  success.value = ''
}
function ok(message: string) {
  success.value = message
  error.value = ''
  setTimeout(() => {
    if (success.value === message) success.value = ''
  }, 4000)
}

function formatDate(iso: string | null, withYear = true) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'America/Guayaquil',
  })
}

// ── Solicitudes ──────────────────────────────────────────────────────────────

const requests = ref<AdminRequest[]>([])
const loadingRequests = ref(false)
const requestFilter = ref<'open' | 'done' | 'all'>('open')
const newRequest = reactive({ title: '', description: '', urgent: false })
const creating = ref(false)
const noteDrafts = reactive<Record<string, string>>({})
const busyRequest = ref<string | null>(null)

const STATUS_LABELS: Record<RequestStatus, string> = {
  nueva: 'Nueva',
  en_progreso: 'En progreso',
  hecha: 'Hecha',
  descartada: 'Descartada',
}

const openCount = computed(
  () => requests.value.filter((r) => r.status === 'nueva' || r.status === 'en_progreso').length,
)

const visibleRequests = computed(() => {
  if (requestFilter.value === 'all') return requests.value
  const open = (r: AdminRequest) => r.status === 'nueva' || r.status === 'en_progreso'
  return requests.value.filter((r) => (requestFilter.value === 'open' ? open(r) : !open(r)))
})

async function loadRequests() {
  loadingRequests.value = true
  try {
    requests.value = (await backofficeService.listRequests()).data.data
  } catch (e) {
    fail(e, 'No se pudieron cargar las solicitudes.')
  } finally {
    loadingRequests.value = false
  }
}

function replaceRequest(updated: AdminRequest) {
  requests.value = requests.value.map((r) => (r._id === updated._id ? updated : r))
}

async function submitRequest() {
  if (!newRequest.title.trim()) {
    error.value = 'Escribe qué necesitas en el título.'
    return
  }
  creating.value = true
  try {
    const created = (
      await backofficeService.createRequest({
        title: newRequest.title.trim(),
        description: newRequest.description.trim(),
        priority: newRequest.urgent ? 'urgente' : 'normal',
      })
    ).data.data
    requests.value = [created, ...requests.value]
    Object.assign(newRequest, { title: '', description: '', urgent: false })
    requestFilter.value = 'open'
    ok('Solicitud enviada. El equipo técnico la revisa a diario.')
  } catch (e) {
    fail(e, 'No se pudo enviar la solicitud.')
  } finally {
    creating.value = false
  }
}

async function changeStatus(request: AdminRequest, status: RequestStatus) {
  busyRequest.value = request._id
  try {
    replaceRequest((await backofficeService.updateRequest(request._id, { status })).data.data)
    ok(`"${request.title}" ahora está: ${STATUS_LABELS[status].toLowerCase()}.`)
  } catch (e) {
    fail(e, 'No se pudo cambiar el estado.')
  } finally {
    busyRequest.value = null
  }
}

async function addNote(request: AdminRequest) {
  const body = (noteDrafts[request._id] || '').trim()
  if (!body) return
  busyRequest.value = request._id
  try {
    replaceRequest((await backofficeService.addNote(request._id, body)).data.data)
    noteDrafts[request._id] = ''
  } catch (e) {
    fail(e, 'No se pudo guardar la nota.')
  } finally {
    busyRequest.value = null
  }
}

async function removeRequest(request: AdminRequest) {
  if (!confirm(`¿Eliminar la solicitud "${request.title}"?`)) return
  try {
    await backofficeService.deleteRequest(request._id)
    requests.value = requests.value.filter((r) => r._id !== request._id)
    ok('Solicitud eliminada.')
  } catch (e) {
    fail(e, 'No se pudo eliminar.')
  }
}

// ── Servicios ────────────────────────────────────────────────────────────────

const services = ref<TechService[]>([])
const loadingServices = ref(false)
const seeding = ref(false)
const savingService = ref(false)
const editingService = ref<TechService | null>(null)
const showServiceForm = ref(false)

const emptyService = () => ({
  name: '',
  category: '',
  provider: '',
  purpose: '',
  url: '',
  accountEmail: '',
  costAmount: '',
  billingPeriod: '' as BillingPeriod,
  paidBy: '',
  renewsAt: '',
  status: 'activo' as TechServiceStatus,
  notes: '',
})
const serviceForm = ref(emptyService())

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  mensual: 'al mes',
  anual: 'al año',
  gratis: 'gratis',
  'por uso': 'según uso',
  '': '',
}

/** Costo mensual estimado con lo que tiene precio cargado. */
const monthlyEstimate = computed(() =>
  services.value.reduce((total, s) => {
    if (s.status === 'cancelado' || s.costAmount == null) return total
    if (s.billingPeriod === 'mensual') return total + s.costAmount
    if (s.billingPeriod === 'anual') return total + s.costAmount / 12
    return total
  }, 0),
)

const missingCost = computed(
  () =>
    services.value.filter(
      (s) =>
        s.status !== 'cancelado' &&
        s.costAmount == null &&
        s.billingPeriod !== 'gratis' &&
        s.billingPeriod !== 'por uso',
    ).length,
)

const pendingServices = computed(() => services.value.filter((s) => s.status === 'pendiente').length)

function daysUntil(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

const renewingSoon = computed(() =>
  services.value.filter((s) => {
    const days = daysUntil(s.renewsAt)
    return s.status !== 'cancelado' && days !== null && days <= 30
  }),
)

function costLabel(s: TechService) {
  if (s.billingPeriod === 'gratis') return 'Gratis'
  if (s.costAmount == null) return s.billingPeriod === 'por uso' ? 'Según uso' : 'Costo por confirmar'
  const amount = `${s.currency || 'USD'} ${s.costAmount.toFixed(2)}`
  return PERIOD_LABELS[s.billingPeriod] ? `${amount} ${PERIOD_LABELS[s.billingPeriod]}` : amount
}

async function loadServices() {
  loadingServices.value = true
  try {
    services.value = (await backofficeService.listServices()).data.data
  } catch (e) {
    fail(e, 'No se pudieron cargar los servicios.')
  } finally {
    loadingServices.value = false
  }
}

async function seedServices() {
  seeding.value = true
  try {
    const res = (await backofficeService.seedServices()).data.data
    services.value = res.services
    ok(res.created ? `Se agregaron ${res.created} servicios. Completa costos y cuentas.` : 'La lista ya estaba completa.')
  } catch (e) {
    fail(e, 'No se pudo cargar la lista.')
  } finally {
    seeding.value = false
  }
}

function openService(service?: TechService) {
  editingService.value = service ?? null
  serviceForm.value = service
    ? {
        name: service.name,
        category: service.category,
        provider: service.provider,
        purpose: service.purpose,
        url: service.url,
        accountEmail: service.accountEmail,
        costAmount: service.costAmount == null ? '' : String(service.costAmount),
        billingPeriod: service.billingPeriod,
        paidBy: service.paidBy,
        renewsAt: service.renewsAt ? service.renewsAt.slice(0, 10) : '',
        status: service.status,
        notes: service.notes,
      }
    : emptyService()
  showServiceForm.value = true
  error.value = ''
}

async function saveService() {
  if (!serviceForm.value.name.trim()) {
    error.value = 'Ponle un nombre al servicio.'
    return
  }
  savingService.value = true
  try {
    const f = serviceForm.value
    const payload = {
      ...f,
      costAmount: f.costAmount === '' ? null : Number(f.costAmount),
      renewsAt: f.renewsAt ? new Date(`${f.renewsAt}T12:00:00-05:00`).toISOString() : null,
    }
    if (editingService.value) {
      const updated = (await backofficeService.updateService(editingService.value._id, payload)).data.data
      services.value = services.value.map((s) => (s._id === updated._id ? updated : s))
    } else {
      services.value = [...services.value, (await backofficeService.createService(payload)).data.data]
    }
    showServiceForm.value = false
    ok('Servicio guardado.')
  } catch (e) {
    fail(e, 'No se pudo guardar el servicio.')
  } finally {
    savingService.value = false
  }
}

async function removeService(service: TechService) {
  if (!confirm(`¿Quitar "${service.name}" de la lista?`)) return
  try {
    await backofficeService.deleteService(service._id)
    services.value = services.value.filter((s) => s._id !== service._id)
    ok('Servicio quitado de la lista.')
  } catch (e) {
    fail(e, 'No se pudo quitar.')
  }
}

onMounted(() => {
  loadRequests()
  loadServices()
})
</script>

<template>
  <div class="bo">
    <header class="bo__header">
      <span class="bo__eyebrow">Administración</span>
      <h1 class="bo__title">Backoffice</h1>
      <p class="bo__subtitle">
        Pide cambios al equipo técnico y revisa todos los servicios que usa la academia: qué hacen,
        cuánto cuestan, quién paga y a nombre de quién están.
      </p>
    </header>

    <div class="bo__tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="bo__tab"
        :class="{ 'is-active': tab === 'requests' }"
        :aria-selected="tab === 'requests'"
        @click="setTab('requests')"
      >
        <i class="fa-solid fa-list-check" /> Solicitudes
        <span v-if="openCount" class="bo__count">{{ openCount }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="bo__tab"
        :class="{ 'is-active': tab === 'services' }"
        :aria-selected="tab === 'services'"
        @click="setTab('services')"
      >
        <i class="fa-solid fa-server" /> Servicios y accesos
      </button>
    </div>

    <p v-if="error" class="bo__alert bo__alert--error" role="alert">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </p>
    <p v-if="success" class="bo__alert bo__alert--success" role="status">
      <i class="fa-solid fa-circle-check" /> {{ success }}
    </p>

    <!-- ── Solicitudes ── -->
    <section v-if="tab === 'requests'" class="bo__panel">
      <form class="bo__card bo__new" @submit.prevent="submitRequest">
        <h2>¿Qué necesitas?</h2>
        <p class="bo__hint">
          Un cambio en la web, una idea o algo que no funciona. Llega directo al equipo técnico y aquí
          verás las notas de lo que se va haciendo.
        </p>
        <input v-model="newRequest.title" type="text" maxlength="140" placeholder="Ej. Cambiar el texto del banner de inicio" />
        <textarea
          v-model="newRequest.description"
          rows="3"
          placeholder="Detalles: dónde está, cómo debería quedar, enlaces o capturas…"
        />
        <div class="bo__new-actions">
          <label class="bo__check">
            <input v-model="newRequest.urgent" type="checkbox" /> Es urgente
          </label>
          <button type="submit" class="bo__btn bo__btn--primary" :disabled="creating">
            <i class="fa-solid" :class="creating ? 'fa-spinner fa-spin' : 'fa-paper-plane'" />
            {{ creating ? 'Enviando…' : 'Enviar solicitud' }}
          </button>
        </div>
      </form>

      <div class="bo__filters">
        <button
          v-for="f in [
            { value: 'open', label: 'Pendientes' },
            { value: 'done', label: 'Hechas y descartadas' },
            { value: 'all', label: 'Todas' },
          ] as const"
          :key="f.value"
          type="button"
          class="bo__chip"
          :class="{ 'is-active': requestFilter === f.value }"
          @click="requestFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <p v-if="loadingRequests && !requests.length" class="bo__empty">
        <i class="fa-solid fa-spinner fa-spin" /> Cargando…
      </p>
      <p v-else-if="!visibleRequests.length" class="bo__empty">
        {{ requestFilter === 'open' ? 'No hay solicitudes pendientes.' : 'Nada por aquí todavía.' }}
      </p>

      <article v-for="request in visibleRequests" :key="request._id" class="bo__card bo__request">
        <div class="bo__request-head">
          <div>
            <h3>
              {{ request.title }}
              <span v-if="request.priority === 'urgente'" class="bo__badge bo__badge--urgent">Urgente</span>
            </h3>
            <small>{{ request.createdByName }} · {{ formatDate(request.createdAt) }}</small>
          </div>
          <div class="bo__request-controls">
            <select
              :value="request.status"
              class="bo__select"
              :class="`is-${request.status}`"
              aria-label="Estado de la solicitud"
              :disabled="busyRequest === request._id"
              @change="changeStatus(request, ($event.target as HTMLSelectElement).value as RequestStatus)"
            >
              <option v-for="(label, value) in STATUS_LABELS" :key="value" :value="value">{{ label }}</option>
            </select>
            <button type="button" class="bo__icon-btn" aria-label="Eliminar solicitud" @click="removeRequest(request)">
              <i class="fa-solid fa-trash" />
            </button>
          </div>
        </div>
        <p v-if="request.description" class="bo__desc">{{ request.description }}</p>

        <ul v-if="request.notes.length" class="bo__notes">
          <li v-for="(note, i) in request.notes" :key="i">
            <strong>{{ note.authorName }}</strong>
            <small>{{ formatDate(note.createdAt, false) }}</small>
            <p>{{ note.body }}</p>
          </li>
        </ul>
        <form class="bo__note-form" @submit.prevent="addNote(request)">
          <input
            v-model="noteDrafts[request._id]"
            type="text"
            placeholder="Agregar una nota (qué se hizo, qué falta…)"
            aria-label="Nueva nota"
          />
          <button type="submit" class="bo__btn bo__btn--ghost" :disabled="busyRequest === request._id || !noteDrafts[request._id]?.trim()">
            Anotar
          </button>
        </form>
      </article>
    </section>

    <!-- ── Servicios ── -->
    <section v-else class="bo__panel">
      <p class="bo__alert bo__alert--info">
        <i class="fa-solid fa-lock" />
        Aquí no se guardan contraseñas. Anota solo a nombre de qué cuenta está cada servicio; las
        claves van en un gestor de contraseñas.
      </p>

      <div v-if="services.length" class="bo__stats">
        <div class="bo__stat">
          <span>Costo mensual estimado</span>
          <strong>USD {{ monthlyEstimate.toFixed(2) }}</strong>
          <small v-if="missingCost">{{ missingCost }} servicios sin costo cargado</small>
        </div>
        <div class="bo__stat">
          <span>Pendientes de transferir o revisar</span>
          <strong>{{ pendingServices }}</strong>
        </div>
        <div class="bo__stat" :class="{ 'is-warning': renewingSoon.length }">
          <span>Renuevan en 30 días</span>
          <strong>{{ renewingSoon.length }}</strong>
          <small v-if="renewingSoon.length">{{ renewingSoon.map((s) => s.name).join(', ') }}</small>
        </div>
      </div>

      <div class="bo__toolbar">
        <button type="button" class="bo__btn bo__btn--primary" @click="openService()">
          <i class="fa-solid fa-plus" /> Agregar servicio
        </button>
        <button type="button" class="bo__btn bo__btn--ghost" :disabled="seeding" @click="seedServices">
          <i class="fa-solid" :class="seeding ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'" />
          {{ services.length ? 'Completar con la lista base' : 'Cargar lista inicial' }}
        </button>
      </div>

      <form v-if="showServiceForm" class="bo__card bo__service-form" @submit.prevent="saveService">
        <h2>{{ editingService ? `Editar: ${editingService.name}` : 'Nuevo servicio' }}</h2>
        <div class="bo__grid">
          <label>Nombre *<input v-model="serviceForm.name" type="text" placeholder="Ej. Dominio luisapitabejarano.com" /></label>
          <label>Categoría<input v-model="serviceForm.category" type="text" placeholder="Ej. Dominio, Hosting, Pagos" /></label>
          <label>Proveedor<input v-model="serviceForm.provider" type="text" placeholder="Ej. Namecheap" /></label>
          <label>Enlace para entrar<input v-model="serviceForm.url" type="url" placeholder="https://…" /></label>
          <label>Cuenta dueña (correo)<input v-model="serviceForm.accountEmail" type="email" placeholder="correo@…" /></label>
          <label>Quién paga<input v-model="serviceForm.paidBy" type="text" placeholder="Ej. Tarjeta de Luisa" /></label>
          <label>Costo (USD)<input v-model="serviceForm.costAmount" type="number" min="0" step="0.01" placeholder="0.00" /></label>
          <label>
            Se cobra
            <select v-model="serviceForm.billingPeriod">
              <option value="">Sin definir</option>
              <option value="mensual">Cada mes</option>
              <option value="anual">Cada año</option>
              <option value="por uso">Según uso</option>
              <option value="gratis">Gratis</option>
            </select>
          </label>
          <label>Próxima renovación<input v-model="serviceForm.renewsAt" type="date" /></label>
          <label>
            Estado
            <select v-model="serviceForm.status">
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente (transferir o revisar)</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
        </div>
        <label>Para qué sirve<textarea v-model="serviceForm.purpose" rows="2" /></label>
        <label>Notas<textarea v-model="serviceForm.notes" rows="2" /></label>
        <div class="bo__new-actions">
          <button type="button" class="bo__btn bo__btn--ghost" @click="showServiceForm = false">Cancelar</button>
          <button type="submit" class="bo__btn bo__btn--primary" :disabled="savingService">
            {{ savingService ? 'Guardando…' : 'Guardar servicio' }}
          </button>
        </div>
      </form>

      <p v-if="loadingServices && !services.length" class="bo__empty">
        <i class="fa-solid fa-spinner fa-spin" /> Cargando…
      </p>
      <p v-else-if="!services.length && !showServiceForm" class="bo__empty">
        Aún no hay servicios. Pulsa <strong>Cargar lista inicial</strong> para empezar con los que ya
        usa la academia.
      </p>

      <div class="bo__services">
        <article v-for="service in services" :key="service._id" class="bo__card bo__service">
          <div class="bo__service-head">
            <div>
              <small class="bo__category">{{ service.category || 'Servicio' }}</small>
              <h3>{{ service.name }}</h3>
            </div>
            <span class="bo__badge" :class="`bo__badge--${service.status}`">
              {{ service.status === 'pendiente' ? 'Pendiente' : service.status === 'cancelado' ? 'Cancelado' : 'Activo' }}
            </span>
          </div>
          <p v-if="service.purpose" class="bo__desc">{{ service.purpose }}</p>
          <dl class="bo__facts">
            <div><dt>Costo</dt><dd>{{ costLabel(service) }}</dd></div>
            <div><dt>Paga</dt><dd>{{ service.paidBy || '—' }}</dd></div>
            <div><dt>Cuenta</dt><dd>{{ service.accountEmail || '—' }}</dd></div>
            <div>
              <dt>Renueva</dt>
              <dd :class="{ 'is-warning': (daysUntil(service.renewsAt) ?? 99) <= 30 }">
                {{ service.renewsAt ? formatDate(service.renewsAt) : '—' }}
              </dd>
            </div>
          </dl>
          <p v-if="service.notes" class="bo__note-line"><i class="fa-solid fa-circle-info" /> {{ service.notes }}</p>
          <div class="bo__service-actions">
            <a v-if="service.url" :href="service.url" target="_blank" rel="noopener" class="bo__btn bo__btn--ghost">
              <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir
            </a>
            <button type="button" class="bo__btn bo__btn--ghost" @click="openService(service)">
              <i class="fa-solid fa-pen" /> Editar
            </button>
            <button type="button" class="bo__icon-btn" :aria-label="`Quitar ${service.name}`" @click="removeService(service)">
              <i class="fa-solid fa-trash" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.bo {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bo__eyebrow {
  font: 600 0.65rem $font-mono;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green-deep;
}

.bo__title {
  font: 400 2rem $font-display;
  margin: 0.2rem 0;
  color: $lpb-black;
}

.bo__subtitle {
  margin: 0;
  max-width: 62ch;
  font: 0.92rem/1.5 $font-sans;
  color: $lpb-graphite;
}

.bo__tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba($lpb-green-deep, 0.15);
}

.bo__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: $lpb-muted;
  font: 600 0.92rem $font-sans;
  cursor: pointer;

  &.is-active {
    color: $lpb-green-deep;
    border-bottom-color: $lpb-green-deep;
  }
}

.bo__count {
  min-width: 1.4rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: $lpb-green-deep;
  color: $lpb-white;
  font-size: 0.75rem;
}

.bo__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bo__alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  font: 0.9rem/1.45 $font-sans;

  &--error {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
  }

  &--success {
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
  }

  &--info {
    background: $lpb-cream;
    color: $lpb-graphite;
  }
}

.bo__card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  background: $lpb-white;

  h2 {
    margin: 0;
    font: 400 1.35rem $font-display;
    color: $lpb-black;
  }

  h3 {
    margin: 0;
    font: 700 1rem $font-sans;
    color: $lpb-black;
  }

  input[type='text'],
  input[type='url'],
  input[type='email'],
  input[type='number'],
  input[type='date'],
  select,
  textarea {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border: 1px solid rgba($lpb-green-deep, 0.2);
    border-radius: 0.7rem;
    background: $lpb-cream;
    font: 0.92rem/1.45 $font-sans;
    color: $lpb-black;

    &:focus {
      outline: none;
      border-color: $lpb-green;
      background: $lpb-white;
      box-shadow: 0 0 0 3px rgba($lpb-green, 0.15);
    }
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font: 600 0.82rem $font-sans;
    color: $lpb-ink;
  }
}

.bo__hint {
  margin: 0;
  font: 0.86rem/1.5 $font-sans;
  color: $lpb-graphite;
}

.bo__new-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.bo__check {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;

  input {
    width: 1.05rem;
    height: 1.05rem;
    accent-color: $alert-error;
  }
}

.bo__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font: 600 0.85rem $font-sans;
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: $lpb-green-deep;
    color: $lpb-white;

    &:hover:not(:disabled) {
      background: $lpb-green-dark;
    }
  }

  &--ghost {
    background: $lpb-white;
    border-color: rgba($lpb-green-deep, 0.22);
    color: $lpb-graphite;

    &:hover:not(:disabled) {
      background: rgba($lpb-green-deep, 0.06);
    }
  }
}

.bo__icon-btn {
  width: 2.3rem;
  height: 2.3rem;
  flex: 0 0 auto;
  border: none;
  border-radius: 999px;
  background: rgba($alert-error, 0.08);
  color: $alert-error;
  cursor: pointer;
}

.bo__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bo__chip {
  padding: 0.45rem 0.9rem;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 999px;
  background: $lpb-white;
  color: $lpb-graphite;
  font: 600 0.8rem $font-sans;
  cursor: pointer;

  &.is-active {
    background: $lpb-green-deep;
    border-color: $lpb-green-deep;
    color: $lpb-white;
  }
}

.bo__empty {
  margin: 0;
  padding: 2rem 1rem;
  border: 1px dashed rgba($lpb-green-deep, 0.25);
  border-radius: 1rem;
  text-align: center;
  font: 0.92rem $font-sans;
  color: $lpb-graphite;
}

.bo__request-head,
.bo__service-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  small {
    font: 0.78rem $font-sans;
    color: $lpb-muted;
  }
}

.bo__request-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.bo__select {
  width: auto !important;
  padding: 0.5rem 0.75rem !important;
  font-weight: 600 !important;

  &.is-en_progreso {
    background: rgba($lpb-amber, 0.14) !important;
  }

  &.is-hecha {
    background: rgba($lpb-green, 0.14) !important;
  }
}

.bo__badge {
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font: 600 0.7rem $font-sans;
  vertical-align: middle;
  white-space: nowrap;

  &--urgent,
  &--cancelado {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
  }

  &--activo {
    background: rgba($lpb-green, 0.14);
    color: $lpb-green-deep;
  }

  &--pendiente {
    background: rgba($lpb-amber, 0.16);
    color: #92400e;
  }
}

.bo__desc {
  margin: 0;
  font: 0.9rem/1.55 $font-sans;
  color: $lpb-graphite;
  white-space: pre-line;
}

.bo__notes {
  list-style: none;
  margin: 0;
  padding: 0.75rem 0 0;
  border-top: 1px solid rgba($lpb-green-deep, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  li {
    padding: 0.65rem 0.85rem;
    border-radius: 0.7rem;
    background: $lpb-cream;
    font-family: $font-sans;
  }

  strong {
    font-size: 0.82rem;
    color: $lpb-black;
  }

  small {
    margin-left: 0.4rem;
    font-size: 0.75rem;
    color: $lpb-muted;
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.88rem;
    line-height: 1.5;
    color: $lpb-graphite;
    white-space: pre-line;
  }
}

.bo__note-form {
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
  }
}

.bo__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.bo__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  font-family: $font-sans;

  span {
    font-size: 0.8rem;
    color: $lpb-muted;
  }

  strong {
    font-size: 1.5rem;
    color: $lpb-black;
  }

  small {
    font-size: 0.75rem;
    color: $lpb-muted;
  }

  &.is-warning {
    border-color: rgba($lpb-amber, 0.5);
    background: rgba($lpb-amber, 0.08);
  }
}

.bo__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.bo__services {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.bo__category {
  font: 600 0.68rem $font-mono !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-green-deep !important;
}

.bo__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 0.75rem;
  margin: 0;

  dt {
    font: 0.72rem $font-sans;
    color: $lpb-muted;
  }

  dd {
    margin: 0;
    font: 600 0.85rem $font-sans;
    color: $lpb-black;
    overflow-wrap: anywhere;

    &.is-warning {
      color: #b45309;
    }
  }
}

.bo__note-line {
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: 0.65rem;
  background: rgba($lpb-amber, 0.1);
  font: 0.82rem/1.45 $font-sans;
  color: $lpb-graphite;
}

.bo__service-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .bo__request-head {
    flex-direction: column;
  }

  .bo__services {
    grid-template-columns: 1fr;
  }

  .bo__note-form {
    flex-direction: column;
  }
}
</style>
