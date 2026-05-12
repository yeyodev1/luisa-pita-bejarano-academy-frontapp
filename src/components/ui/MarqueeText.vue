<script setup lang="ts">
defineProps<{ items: string[]; speed?: number; theme?: 'light' | 'dark' | 'green' }>()
</script>

<template>
  <section class="marquee" :class="`marquee--${theme ?? 'dark'}`" :style="{ '--speed': `${speed ?? 38}s` }">
    <div class="marquee__track">
      <div class="marquee__group" v-for="g in 2" :key="g" aria-hidden="true">
        <span v-for="(item, i) in items" :key="`${g}-${i}`" class="marquee__item">
          <span class="marquee__bullet">✦</span>
          <span>{{ item }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.marquee {
  --speed: 38s;
  overflow: hidden;
  min-height: clamp(4rem, 8vw, 6rem);
  display: flex;
  align-items: center;
  padding-block: clamp(1rem, 2vw, 1.5rem);
  border-block: 1px solid transparent;

  &--dark {
    background: $lpb-black;
    color: $lpb-white;
    border-color: rgba($lpb-white, 0.08);
  }

  &--light {
    background: $lpb-paper;
    color: $lpb-black;
    border-color: $lpb-line;
  }

  &--green {
    background: linear-gradient(90deg, $lpb-green 0%, #1DB87A 40%, #C9A84C 100%);
    color: $lpb-black;
  }
}

.marquee__track {
  display: flex;
  width: max-content;
  animation: marquee-scroll var(--speed) linear infinite;
}

.marquee__group {
  display: flex;
  gap: 3rem;
  padding-right: 3rem;
  flex-shrink: 0;
}

.marquee__item {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  font-family: $font-display;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.25rem, 5vw, 2.75rem);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.marquee__bullet {
  color: $lpb-green;
  font-style: normal;
  font-family: $font-mono;
  font-size: 0.8em;
}

.marquee--green .marquee__bullet {
  color: $lpb-gold;
  text-shadow: 0 0 8px rgba($lpb-gold, 0.4);
}

@keyframes marquee-scroll {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    animation: none;
  }
}
</style>
