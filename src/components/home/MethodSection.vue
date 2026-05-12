<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/composables/useScrollReveal'

const pillars = [
  {
    n: '01',
    title: 'Entrenamiento',
    body: 'Programas de entrenamiento progresivo que evolucionan contigo. En casa o gimnasio, sin exigirte dos horas diarias. Resultados que se acumulan semana a semana.',
  },
  {
    n: '02',
    title: 'Nutrición flexible',
    body: 'Aprenderás a comer con libertad inteligente. Nada de contar calorías obsesivamente ni eliminar grupos de comida. Resultados que se mantienen porque no dependen de la restricción.',
  },
  {
    n: '03',
    title: 'Mentalidad y comunidad',
    body: 'Sesiones grupales con Luisa, retos mensuales medibles y un círculo cerrado de mujeres que avanzan contigo. Sin curiosas, sin ruido.',
  },
]

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    gsap.from(root.value!.querySelectorAll('.method__title-mask > *'), {
      yPercent: 110,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: root.value, start: 'top 70%' },
    })
    gsap.from(root.value!.querySelectorAll('.method__card'), {
      opacity: 0,
      y: 60,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '.method__grid', start: 'top 75%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="method" id="metodologia" ref="root">
    <div class="method__inner">
      <header class="method__header">
        <span class="eyebrow eyebrow--green">Metodología Luisa Pita Bejarano</span>
        <h2 class="method__title display-lg">
          <span class="method__title-mask"><span>Tres pilares.</span></span>
          <span class="method__title-mask"><span class="method__title--italic">Doce meses.</span></span>
        </h2>
        <p class="method__lede lede">
          Un sistema completo de coaching fitness anual: entrenamiento, nutrición flexible y
          comunidad. La diferencia entre transformaciones que duran y las que se evaporan en marzo.
        </p>
      </header>

      <div class="method__grid">
        <article
          v-for="(p, i) in pillars"
          :key="p.n"
          class="method__card"
          :class="`method__card--${i + 1}`"
        >
          <span class="method__num">{{ p.n }}</span>
          <h3 class="method__card-title">{{ p.title }}</h3>
          <p class="method__card-body">{{ p.body }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.method {
  background: $lpb-black;
  color: $lpb-white;
  padding-block: clamp(5rem, 12vw, 9rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
}

.method__inner {
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;
}

.method__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 1100px;
  margin-inline: auto;
  margin-bottom: clamp(2.5rem, 6vw, 4.5rem);
}

.method__title {
  margin: 0;
  color: $lpb-white;
}

.method__title-mask {
  display: block;
  overflow: hidden;
}

.method__title--italic {
  font-style: italic;
  color: $lpb-green;
}

.method__lede {
  color: rgba($lpb-white, 0.7);
  max-width: 75ch;
  margin-inline: auto;
}

.method__grid {
  display: grid;
  gap: 1px;
  grid-template-columns: 1fr;
  background: rgba($lpb-white, 0.12);
  border-block: 1px solid rgba($lpb-white, 0.12);

  @media (min-width: 880px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.method__card {
  position: relative;
  background: $lpb-black;
  padding: clamp(2.5rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transition: background .35s ease, box-shadow .4s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(ellipse at 50% 0%, rgba($lpb-green, 0.06), transparent 70%);
    opacity: 0;
    transition: opacity .4s ease;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity .4s ease;
  }

  &--1::after { background: $lpb-green; }
  &--2::after { background: $lpb-gold; }
  &--3::after { background: linear-gradient(90deg, $lpb-green-dark, $lpb-green); }

  &:hover {
    background: $lpb-ink;
    box-shadow: 0 8px 32px rgba($lpb-green, 0.08);
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover::after {
    opacity: 1;
  }
}

.method__num {
  font-family: $font-mono;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  align-self: flex-start;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  position: relative;
  z-index: 1;
  transition: all .3s ease;
  border: none;

  .method__card--1 & {
    background: rgba($lpb-green, 0.2);
    color: $lpb-green;
  }

  .method__card--2 & {
    background: rgba($lpb-gold, 0.2);
    color: $lpb-gold;
  }

  .method__card--3 & {
    background: rgba($lpb-green-dark, 0.2);
    color: $lpb-green;
  }
}

.method__card-title {
  font-family: $font-display;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.65rem, 2.6vw, 2.1rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  margin: 0;
}

.method__card-body {
  font-family: $font-sans;
  color: rgba($lpb-white, 0.7);
  font-size: 1rem;
  line-height: 1.55;
  margin: 0;
}
</style>
