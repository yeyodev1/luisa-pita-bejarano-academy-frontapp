<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { contentService } from '@/services/contentService'
import type { RecordedClass } from '@/types'

// ── state ─────────────────────────────────────────────────────────────────────
const classes = ref<RecordedClass[]>([])
const loading = ref(false)
const error = ref('')

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Guayaquil',
  })
}

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Guayaquil',
  })
}

function formatYear(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    year: 'numeric',
    timeZone: 'America/Guayaquil',
  })
}

// Group classes by month/year
const grouped = computed<{ label: string; items: RecordedClass[] }[]>(() => {
  const map = new Map<string, RecordedClass[]>()
  for (const cls of classes.value) {
    const key = new Date(cls.classDate).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      timeZone: 'America/Guayaquil',
    })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(cls)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
})

// ── data ──────────────────────────────────────────────────────────────────────
async function fetchClasses() {
  loading.value = true
  error.value = ''
  try {
    const res = await contentService.getRecordedClasses({ limit: 100 })
    classes.value = res.data.data.classes
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || 'No se pudieron cargar las clases.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchClasses)
</script>

<template>
  <div class="rc-view">
    <!-- Hero header -->
    <header class="rc-hero">
      <div class="rc-hero__copy">
        <span class="rc-hero__eyebrow">
          <i class="fa-solid fa-film" /> Biblioteca de clases
        </span>
        <h1 class="rc-hero__title">Clases grabadas</h1>
        <p class="rc-hero__desc">
          Accede a la grabación de cada clase en vivo y repásala cuando quieras. Todas en hora Ecuador.
        </p>
      </div>
      <div class="rc-hero__badge">
        <i class="fa-solid fa-earth-americas" />
        <div>
          <strong>Hora Ecuador</strong>
          <span>America/Guayaquil · UTC-5</span>
        </div>
      </div>
    </header>

    <!-- Error -->
    <p v-if="error" class="rc-view__alert">
      <i class="fa-solid fa-triangle-exclamation" />
      {{ error }}
      <button type="button" @click="fetchClasses">Reintentar</button>
    </p>

    <!-- Loading -->
    <div v-if="loading" class="rc-view__loading">
      <i class="fa-solid fa-spinner fa-spin" />
      Cargando clases grabadas…
    </div>

    <!-- Empty -->
    <div v-else-if="!loading && classes.length === 0" class="rc-view__empty">
      <i class="fa-solid fa-film" />
      <p>Aún no hay clases grabadas disponibles. Vuelve pronto.</p>
    </div>

    <!-- Grouped list -->
    <template v-else>
      <section
        v-for="group in grouped"
        :key="group.label"
        class="rc-group"
        :aria-label="`Clases de ${group.label}`"
      >
        <div class="rc-group__header">
          <span class="rc-group__month">{{ group.label }}</span>
          <span class="rc-group__count">{{ group.items.length }} clase{{ group.items.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="rc-grid">
          <article
            v-for="cls in group.items"
            :key="cls._id"
            class="rc-card"
          >
            <!-- Date chip -->
            <div class="rc-card__date-chip">
              <span class="rc-card__day">{{ formatShortDate(cls.classDate) }}</span>
              <span class="rc-card__year">{{ formatYear(cls.classDate) }}</span>
            </div>

            <!-- Body -->
            <div class="rc-card__body">
              <h3 class="rc-card__title">{{ cls.title }}</h3>
              <div class="rc-card__meta">
                <span class="rc-card__time">
                  <i class="fa-regular fa-clock" />
                  {{ cls.startsAt }} – {{ cls.endsAt }}
                </span>
                <span class="rc-card__date-full">
                  <i class="fa-regular fa-calendar" />
                  {{ formatDate(cls.classDate) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="rc-card__actions">
              <a
                :href="cls.recordingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rc-card__btn rc-card__btn--primary"
              >
                <i class="fa-solid fa-play" />
                Ver grabación
              </a>
              <a
                v-if="cls.notesUrl"
                :href="cls.notesUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rc-card__btn rc-card__btn--notes"
              >
                <i class="fa-solid fa-file-lines" />
                Notas
              </a>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.rc-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

// ── Hero ──────────────────────────────────────────────────────────────────────
.rc-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  color: $lpb-white;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  border-radius: 1.5rem;
}

.rc-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 360px;
}

.rc-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: $lpb-green;
  font: 700 0.68rem $font-mono;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.rc-hero__title {
  margin: 0;
  font: 400 clamp(2rem, 5vw, 3rem) $font-display;
}

.rc-hero__desc {
  max-width: 58ch;
  margin: 0;
  font: 0.93rem/1.6 $font-sans;
  opacity: 0.82;
}

.rc-hero__badge {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.15rem;
  color: $lpb-black;
  background: $lpb-green;
  border-radius: 1rem;

  > i { font-size: 1.35rem; }
  div { display: flex; flex-direction: column; gap: 0.1rem; }
  strong { font: 700 0.78rem $font-mono; text-transform: uppercase; }
  span { font: 0.72rem $font-sans; }
}

// ── Feedback ─────────────────────────────────────────────────────────────────
.rc-view__alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: 0.8rem;
  font: 0.85rem $font-sans;

  button { color: inherit; font-weight: 700; text-decoration: underline; }
}

.rc-view__loading,
.rc-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: $lpb-green-deep;
  background: $lpb-white;
  border: 1px dashed rgba($lpb-green-deep, 0.25);
  border-radius: 1.25rem;
  font: 0.9rem $font-sans;
  text-align: center;

  i { font-size: 2rem; opacity: 0.45; }
}

// ── Group ─────────────────────────────────────────────────────────────────────
.rc-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rc-group__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-bottom: 0.5rem;
  border-bottom: 1.5px solid rgba($lpb-green-deep, 0.15);
}

.rc-group__month {
  color: $lpb-black;
  font: 400 1.35rem $font-display;
  text-transform: capitalize;
}

.rc-group__count {
  color: $lpb-green-deep;
  font: 700 0.7rem $font-mono;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

// ── Grid ──────────────────────────────────────────────────────────────────────
.rc-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

// ── Card ──────────────────────────────────────────────────────────────────────
.rc-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.25rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.14);
  border-radius: 1.25rem;
  transition: box-shadow 0.18s, border-color 0.18s;

  &:hover {
    border-color: rgba($lpb-green, 0.5);
    box-shadow: 0 4px 16px rgba($lpb-green-deep, 0.08);
  }
}

.rc-card__date-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 3.5rem;
  padding: 0.6rem;
  background: rgba($lpb-green, 0.12);
  border-radius: 0.9rem;
  text-align: center;
  flex-shrink: 0;
}

.rc-card__day {
  color: $lpb-green-deep;
  font: 700 0.88rem $font-mono;
  white-space: nowrap;
}

.rc-card__year {
  color: $lpb-green-deep;
  font: 0.65rem $font-sans;
  opacity: 0.7;
}

.rc-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 200px;
  min-width: 0;
}

.rc-card__title {
  margin: 0;
  color: $lpb-black;
  font: 600 1rem $font-sans;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rc-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.2rem;
}

.rc-card__time,
.rc-card__date-full {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: $lpb-green-deep;
  font: 0.78rem $font-sans;
  opacity: 0.85;
  white-space: nowrap;
}

.rc-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.rc-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font: 700 0.68rem $font-mono;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.18s, opacity 0.18s;

  &--primary {
    color: $lpb-white;
    background: $lpb-green-deep;
    &:hover { background: $lpb-black; }
  }

  &--notes {
    color: #7d6608;
    background: rgba(#f39c12, 0.12);
    &:hover { background: rgba(#f39c12, 0.22); }
  }
}

// ── Responsive ────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .rc-hero { align-items: stretch; }
  .rc-hero__badge { width: 100%; }
  .rc-card__title { white-space: normal; }
  .rc-card__actions { margin-left: 0; width: 100%; }
  .rc-card__btn { flex: 1 1 120px; justify-content: center; }
}
</style>
