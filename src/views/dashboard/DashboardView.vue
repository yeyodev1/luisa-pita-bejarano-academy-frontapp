<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import LaunchBlocker from '@/components/dashboard/LaunchBlocker.vue'

const launchDeadline = (import.meta.env.VITE_LAUNCH_DEADLINE as string) || '2026-07-16T00:00:00-05:00'
const isBeforeLaunch = computed(() => new Date().getTime() < new Date(launchDeadline).getTime())

const dashboardStore = useDashboardStore()

const subscriptionStatusLabel = computed(() => {
  switch (dashboardStore.subscription.status) {
    case 'active':
      return 'Activa'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Inactiva'
  }
})

const expiresAtLabel = computed(() => {
  if (!dashboardStore.subscription.expiresAt) return 'Sin fecha'
  const date = new Date(dashboardStore.subscription.expiresAt)
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
})

const nextLive = computed(() => dashboardStore.nextLiveClass)

const recentCourses = computed(() => dashboardStore.courses.slice(0, 3))

function formatDate(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <LaunchBlocker v-if="isBeforeLaunch" :deadline="launchDeadline" />
  <div v-else class="dashboard-view">
    <section class="stats">
      <div class="stat-card stat-card--progress">
        <span class="stat-card__value">{{ dashboardStore.totalProgress }}%</span>
        <span class="stat-card__label">Progreso general</span>
        <div class="stat-card__bar"><div class="stat-card__fill" :style="{ width: `${dashboardStore.totalProgress}%` }" /></div>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ dashboardStore.courses.length }}</span>
        <span class="stat-card__label">Cursos disponibles</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ dashboardStore.completedAchievements.length }}</span>
        <span class="stat-card__label">Logros desbloqueados</span>
      </div>
      <div class="stat-card" :class="`stat-card--${dashboardStore.subscription.status}`">
        <span class="stat-card__value">{{ subscriptionStatusLabel }}</span>
        <span class="stat-card__label">Suscripción hasta {{ expiresAtLabel }}</span>
      </div>
    </section>

    <section v-if="nextLive" class="live-banner">
      <div class="live-banner__content">
        <span class="live-banner__eyebrow">Próxima clase en vivo</span>
        <h2 class="live-banner__title">{{ nextLive.title }}</h2>
        <p class="live-banner__meta">{{ nextLive.coach }} · {{ nextLive.date }} a las {{ nextLive.time }} · {{ nextLive.duration }}</p>
      </div>
      <RouterLink :to="{ name: 'live-classes' }" class="live-banner__cta">Ver todas</RouterLink>
    </section>

    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Continúa aprendiendo</h2>
        <RouterLink :to="{ name: 'courses' }" class="section__link">Ver todos los cursos</RouterLink>
      </div>
      <div class="course-grid">
        <RouterLink
          v-for="course in recentCourses"
          :key="course.id"
          :to="{ name: 'course-detail', params: { courseId: course.id } }"
          class="course-card"
        >
          <div class="course-card__thumb">
            <img :src="course.thumbnail" :alt="course.title" />
            <span class="course-card__category">{{ course.category }}</span>
          </div>
          <div class="course-card__body">
            <h3 class="course-card__title">{{ course.title }}</h3>
            <p class="course-card__subtitle">{{ course.subtitle }}</p>
            <div class="course-card__progress">
              <div class="course-card__progress-bar"><div class="course-card__progress-fill" :style="{ width: `${course.progress}%` }" /></div>
              <span class="course-card__progress-value">{{ course.progress }}%</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Últimos logros</h2>
        <RouterLink :to="{ name: 'achievements' }" class="section__link">Ver todos</RouterLink>
      </div>
      <div class="achievements-row">
        <div
          v-for="achievement in dashboardStore.achievements.slice(0, 4)"
          :key="achievement.id"
          class="achievement-badge"
          :class="{ 'achievement-badge--locked': achievement.isLocked }"
        >
          <div class="achievement-badge__icon">
            <i :class="achievement.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-medal'" aria-hidden="true" />
          </div>
          <span class="achievement-badge__title">{{ achievement.title }}</span>
          <span v-if="!achievement.isLocked && achievement.unlockedAt" class="achievement-badge__date">{{ formatDate(achievement.unlockedAt) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 16px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  &__value {
    font-family: $font-display;
    font-size: 1.75rem;
    color: $lpb-black;
  }

  &__label {
    font-family: $font-sans;
    font-size: 0.85rem;
    color: $lpb-muted;
  }

  &__bar {
    height: 6px;
    background: rgba($lpb-black, 0.06);
    border-radius: 999px;
    margin-top: 0.5rem;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $lpb-green;
    border-radius: 999px;
    transition: width 0.6s cubic-bezier(0.2, 0.7, 0, 1);
  }

  &--active &__value {
    color: $lpb-green-deep;
  }

  &--pending &__value {
    color: $lpb-amber;
  }

  &--none &__value {
    color: $lpb-muted;
  }
}

.live-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background: linear-gradient(135deg, $lpb-green 0%, $lpb-green-dark 100%);
  color: $lpb-black;
  border-radius: 1rem;
  padding: 1.5rem 2rem;

  &__eyebrow {
    font-family: $font-mono;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__title {
    font-family: $font-display;
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0.25rem 0 0;
  }

  &__meta {
    font-family: $font-sans;
    font-size: 0.9rem;
    margin: 0.35rem 0 0;
    opacity: 0.9;
  }

  &__cta {
    flex-shrink: 0;
    background: $lpb-black;
    color: $lpb-white;
    font-family: $font-mono;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.75rem 1.25rem;
    border-radius: 999px;
    transition: background 0.2s ease;

    &:hover {
      background: $lpb-ink;
    }
  }
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.section__title {
  font-family: $font-display;
  font-size: 1.35rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.section__link {
  font-family: $font-mono;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $lpb-green-deep;

  &:hover {
    text-decoration: underline;
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.course-card {
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba($lpb-black, 0.08);
  }

  &__thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__category {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: $lpb-paper;
    color: $lpb-black;
    font-family: $font-mono;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
  }

  &__body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-family: $font-display;
    font-size: 1.1rem;
    font-weight: 400;
    margin: 0;
    color: $lpb-black;
  }

  &__subtitle {
    font-family: $font-sans;
    font-size: 0.85rem;
    color: $lpb-muted;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.25rem;
  }

  &__progress-bar {
    flex: 1 1 auto;
    height: 6px;
    background: rgba($lpb-black, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: $lpb-green;
    border-radius: 999px;
  }

  &__progress-value {
    font-family: $font-mono;
    font-size: 0.7rem;
    color: $lpb-muted;
  }
}

.achievements-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.achievement-badge {
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba($lpb-green, 0.12);
    color: $lpb-green-deep;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  &__title {
    font-family: $font-sans;
    font-size: 0.9rem;
    font-weight: 600;
    color: $lpb-black;
  }

  &__date {
    font-family: $font-mono;
    font-size: 0.65rem;
    color: $lpb-muted;
  }

  &--locked {
    opacity: 0.55;

    .achievement-badge__icon {
      background: rgba($lpb-black, 0.05);
      color: $lpb-muted;
    }
  }
}

@media (max-width: 1200px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }

  .achievements-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .live-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
