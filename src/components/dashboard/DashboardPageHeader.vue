<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const route = useRoute()
const userStore = useUserStore()

const isHydrating = computed(() => !userStore.name)

const showSkeleton = computed(() => props.loading || isHydrating.value)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Inicio',
    courses: 'Mis cursos',
    'course-detail': 'Curso',
    lesson: 'Clase',
    calendar: 'Calendario',
    recipes: 'Recetas',
    achievements: 'Logros',
    settings: 'Configuración',
    payments: 'Pagos',
  }
  return titles[route.name as string] || 'Mi cuenta'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})
</script>

<template>
  <header class="page-header">
    <div v-if="showSkeleton" class="page-header__main page-header__main--skeleton">
      <span class="skeleton skeleton--greeting" />
      <span class="skeleton skeleton--title" />
    </div>
    <div v-else class="page-header__main">
      <span class="page-header__greeting">{{ greeting }}, {{ userStore.name }}</span>
      <h1 class="page-header__title">{{ pageTitle }}</h1>
    </div>
    <span v-if="showSkeleton" class="skeleton skeleton--date" />
    <span v-else class="page-header__date">{{ todayLabel }}</span>
  </header>
</template>

<style lang="scss" scoped>
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 -2rem 1.5rem;
  padding: 1.5rem 2rem;
  background: rgba($lpb-cream, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.page-header__main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.page-header__greeting {
  font-family: $font-sans;
  font-size: 0.95rem;
  color: $lpb-muted;
}

.page-header__title {
  font-family: $font-display;
  font-size: 1.75rem;
  font-weight: 400;
  color: $lpb-black;
  margin: 0;
}

.page-header__date {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    rgba($lpb-black, 0.06) 25%,
    rgba($lpb-black, 0.1) 50%,
    rgba($lpb-black, 0.06) 75%
  );
  background-size: 200% 100%;
  border-radius: 0.5rem;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.skeleton--greeting {
  width: 180px;
  height: 1rem;
}

.skeleton--title {
  width: 240px;
  height: 2.1rem;
  border-radius: 0.6rem;
}

.skeleton--date {
  width: 120px;
  height: 0.8rem;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 960px) {
  .page-header {
    margin: 0 -1rem 1.5rem;
    padding: 1.25rem 1rem;
  }
}

@media (max-width: 720px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }

  .page-header__title {
    font-size: 1.5rem;
  }
}
</style>
