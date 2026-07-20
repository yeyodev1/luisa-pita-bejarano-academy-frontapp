<template>
  <div class="skeleton">
    <div class="skeleton__header">
      <div class="skeleton__title" />
      <div class="skeleton__actions">
        <div class="skeleton__pill" />
        <div class="skeleton__avatar" />
      </div>
    </div>

    <div class="skeleton__grid">
      <div v-for="i in 4" :key="`stat-${i}`" class="skeleton__stat" />
    </div>

    <div class="skeleton__section">
      <div class="skeleton__section-title" />
      <div class="skeleton__cards">
        <div v-for="i in 3" :key="`card-${i}`" class="skeleton__card">
          <div class="skeleton__card-thumb" />
          <div class="skeleton__card-line skeleton__card-line--lg" />
          <div class="skeleton__card-line" />
          <div class="skeleton__card-line skeleton__card-line--sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@mixin shimmer {
  background: linear-gradient(
    90deg,
    rgba($lpb-green, 0.08) 0%,
    rgba($lpb-green, 0.24) 50%,
    rgba($lpb-green, 0.08) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skeleton__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
}

.skeleton__title {
  width: 180px;
  height: 28px;
  border-radius: 0.5rem;
  @include shimmer;
}

.skeleton__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.skeleton__pill {
  width: 120px;
  height: 32px;
  border-radius: 999px;
  @include shimmer;
}

.skeleton__avatar {
  width: 110px;
  height: 38px;
  border-radius: 999px;
  @include shimmer;
}

.skeleton__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.skeleton__stat {
  flex: 1 1 220px;
  height: 110px;
  border-radius: 1rem;
  @include shimmer;
}

.skeleton__section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton__section-title {
  width: 160px;
  height: 22px;
  border-radius: 0.4rem;
  @include shimmer;
}

.skeleton__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.skeleton__card {
  flex: 1 1 280px;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, .2);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton__card-thumb {
  aspect-ratio: 16 / 9;
  border-radius: 0.75rem;
  @include shimmer;
}

.skeleton__card-line {
  height: 14px;
  border-radius: 0.35rem;
  @include shimmer;

  &--lg { width: 70%; }
  &--sm { width: 40%; }
}

@media (max-width: 1200px) {
  .skeleton__stat { flex-basis: 42%; }
  .skeleton__card { flex-basis: 42%; }
}

@media (max-width: 720px) {
  .skeleton__stat, .skeleton__card { flex-basis: 100%; }
}
</style>
