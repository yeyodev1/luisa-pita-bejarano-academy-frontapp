<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminService, type AdminUser } from '@/services/adminService'
import { adminContentService } from '@/services/adminContentService'
import type { PhysicalAssessment } from '@/types/assessment'
import {
  checkpointLabel,
  hasCheckpointInMonth,
  lastCheckpointDate,
  sortedCheckpoints,
} from '@/utils/assessmentMetrics'

interface Row {
  user: AdminUser
  assessment: PhysicalAssessment | null
  checkpointCount: number
  lastLabel: string
  lastDate: string | null
  status: 'al-dia' | 'pendiente' | 'sin-registros'
}

const router = useRouter()

const users = ref<AdminUser[]>([])
const assessments = ref<PhysicalAssessment[]>([])
const loading = ref(true)
const error = ref('')

const monthName = computed(() =>
  new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }),
)

const rows = computed<Row[]>(() => {
  const byUser = new Map<string, PhysicalAssessment>()
  for (const assessment of assessments.value) {
    const user = assessment.user
    const id = typeof user === 'object' ? user._id : user
    byUser.set(id, assessment)
  }
  const list = users.value
    .filter((user) => user.role === 'user')
    .map((user): Row => {
      const assessment = byUser.get(user.id) ?? null
      const checkpoints = sortedCheckpoints(assessment)
      const last = checkpoints[checkpoints.length - 1]
      const status: Row['status'] = !checkpoints.length
        ? 'sin-registros'
        : hasCheckpointInMonth(assessment)
          ? 'al-dia'
          : 'pendiente'
      return {
        user,
        assessment,
        checkpointCount: checkpoints.length,
        lastLabel: last ? checkpointLabel(last.monthIndex) : '—',
        lastDate: lastCheckpointDate(assessment),
        status,
      }
    })
  const order: Record<Row['status'], number> = { pendiente: 0, 'sin-registros': 1, 'al-dia': 2 }
  return list.sort((a, b) => order[a.status] - order[b.status])
})

const stats = computed(() => ({
  alDia: rows.value.filter((row) => row.status === 'al-dia').length,
  pendientes: rows.value.filter((row) => row.status === 'pendiente').length,
  sinRegistros: rows.value.filter((row) => row.status === 'sin-registros').length,
}))

const statusMeta: Record<Row['status'], { label: string; icon: string }> = {
  'al-dia': { label: 'Al día', icon: 'fa-circle-check' },
  pendiente: { label: 'Pendiente este mes', icon: 'fa-clock' },
  'sin-registros': { label: 'Sin registros', icon: 'fa-circle-xmark' },
}

function formatDate(iso: string | null) {
  if (!iso) return 'Sin fecha'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openDetail(row: Row) {
  router.push({
    name: 'admin-assessment',
    params: { userId: row.user.id },
    query: { name: `${row.user.name} ${row.user.lastName}`.trim() },
  })
}

onMounted(async () => {
  try {
    const [usersRes, assessmentsRes] = await Promise.all([
      adminService.listUsers({ limit: 100 }),
      adminContentService.listAssessments(),
    ])
    users.value = usersRes.data.data.users
    assessments.value = assessmentsRes.data.data.assessments
  } catch (err) {
    error.value =
      (err as { message?: string })?.message || 'No se pudieron cargar las valoraciones.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="aal">
    <header class="aal__header">
      <div>
        <p class="aal__kicker">Valoraciones físicas</p>
        <h1 class="aal__title">Progreso de las alumnas</h1>
        <p class="aal__subtitle">Registro mensual — {{ monthName }}</p>
      </div>
      <div class="aal__stats">
        <span class="aal__stat aal__stat--good">
          <i class="fa-solid fa-circle-check" /> {{ stats.alDia }} al día
        </span>
        <span class="aal__stat aal__stat--warn">
          <i class="fa-solid fa-clock" /> {{ stats.pendientes }} pendientes
        </span>
        <span class="aal__stat aal__stat--bad">
          <i class="fa-solid fa-circle-xmark" /> {{ stats.sinRegistros }} sin registros
        </span>
      </div>
    </header>

    <p v-if="error" class="aal__alert">{{ error }}</p>

    <div v-if="loading" class="aal__loading">
      <i class="fa-solid fa-spinner fa-spin" />
      Cargando valoraciones…
    </div>

    <div v-else class="aal__table-wrap">
      <table class="aal__table">
        <thead>
          <tr>
            <th>Alumna</th>
            <th>Estado del mes</th>
            <th>Último registro</th>
            <th>Registros</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.user.id">
            <td>
              <div class="aal__user">
                <span class="aal__user-name">{{ row.user.name }} {{ row.user.lastName }}</span>
                <span class="aal__user-email">{{ row.user.email }}</span>
              </div>
            </td>
            <td>
              <span class="aal__badge" :class="`aal__badge--${row.status}`">
                <i class="fa-solid" :class="statusMeta[row.status].icon" />
                {{ statusMeta[row.status].label }}
              </span>
            </td>
            <td>
              <span class="aal__last">
                {{ row.lastLabel }}
                <span v-if="row.lastDate" class="aal__last-date">{{ formatDate(row.lastDate) }}</span>
              </span>
            </td>
            <td>
              <span class="aal__count">{{ row.checkpointCount }}</span>
            </td>
            <td>
              <button class="aal__action" type="button" title="Ver valoración" @click="openDetail(row)">
                <i class="fa-solid fa-chart-line" />
                Ver progreso
              </button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="5" class="aal__empty">No hay alumnas registradas todavía.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.aal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.aal__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  color: $lpb-white;
}

.aal__kicker {
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $lpb-green;
  margin: 0 0 0.25rem;
}

.aal__title {
  font-family: $font-display;
  font-size: 1.7rem;
  margin: 0 0 0.2rem;
}

.aal__subtitle {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: rgba($lpb-white, 0.75);
  margin: 0;
  text-transform: capitalize;
}

.aal__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.aal__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba($lpb-white, 0.1);
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--good i {
    color: $lpb-green;
  }

  &--warn i {
    color: $lpb-amber;
  }

  &--bad i {
    color: lighten($alert-error, 15%);
  }
}

.aal__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: $alert-error-bg;
  color: $alert-error;
  font-family: $font-sans;
  font-size: 0.85rem;
  margin: 0;
}

.aal__loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem;
  font-family: $font-sans;
  color: $lpb-muted;
}

.aal__table-wrap {
  overflow-x: auto;
  border: 1px solid rgba($lpb-green-deep, 0.12);
  border-radius: 1rem;
  background: $lpb-white;
}

.aal__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;

  th {
    padding: 0.85rem 1rem;
    text-align: left;
    font-family: $font-mono;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: $lpb-muted;
    border-bottom: 1px solid rgba($lpb-green-deep, 0.12);
  }

  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba($lpb-green-deep, 0.06);
  }
}

.aal__user {
  display: flex;
  flex-direction: column;
}

.aal__user-name {
  font-family: $font-sans;
  font-size: 0.9rem;
  font-weight: 600;
  color: $lpb-black;
}

.aal__user-email {
  font-family: $font-sans;
  font-size: 0.75rem;
  color: $lpb-muted;
}

.aal__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--al-dia {
    background: $alert-success-bg;
    color: $alert-success;
  }

  &--pendiente {
    background: rgba($lpb-amber, 0.15);
    color: darken($lpb-amber, 18%);
  }

  &--sin-registros {
    background: $alert-error-bg;
    color: $alert-error;
  }
}

.aal__last {
  font-family: $font-sans;
  font-size: 0.85rem;
  color: $lpb-ink;
  display: flex;
  flex-direction: column;
}

.aal__last-date {
  font-size: 0.72rem;
  color: $lpb-muted;
}

.aal__count {
  font-family: $font-mono;
  font-size: 0.85rem;
  font-weight: 700;
  color: $lpb-green-deep;
}

.aal__action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba($lpb-green-deep, 0.08);
  color: $lpb-green-deep;
  font-family: $font-mono;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($lpb-green-deep, 0.18);
  }
}

.aal__empty {
  text-align: center;
  font-family: $font-sans;
  color: $lpb-muted;
  padding: 2rem !important;
}
</style>
