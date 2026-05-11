<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/composables/useScrollReveal'

const includes = [
  { num: '01', title: 'Rutinas semanales para mujeres ocupadas', body: 'Entrenamientos diseñados por Luisa para casa o gimnasio. Para tu agenda real, no una imaginaria.' },
  { num: '02', title: 'Comunidad anual cerrada', body: 'Un círculo de mujeres que avanzan contigo. Sin curiosas, sin ruido. Solo decididas.' },
  { num: '03', title: 'Plan nutricional flexible', body: 'Hábitos sostenibles, no dietas restrictivas. Adaptado para viajes, eventos y vida real.' },
  { num: '04', title: 'Sesiones grupales con Luisa', body: 'Espacios en vivo durante el año para resolver dudas, ajustar tu plan y mantenerte en ruta.' },
  { num: '05', title: 'Retos mensuales medibles', body: 'Pequeñas metas que se acumulan a lo largo de doce meses. Un cuerpo distinto al final del año.' },
  { num: '06', title: 'Acompañamiento cercano', body: 'Luisa y su equipo cerca todo el año. No estás sola — estás dentro de una estructura que te empuja.' },
]

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    gsap.from(root.value!.querySelectorAll('.community__row'), {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.community__list', start: 'top 75%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="community" id="comunidad" ref="root">
    <div class="community__inner">
      <header class="community__header">
        <span class="eyebrow community__eyebrow">Qué incluye el año</span>
        <h2 class="community__title display-lg">
          Un sistema completo,<br />
          <span class="community__title--italic">no piezas sueltas.</span>
        </h2>
      </header>

      <ol class="community__list">
        <li v-for="item in includes" :key="item.num" class="community__row">
          <span class="community__num">{{ item.num }}</span>
          <div class="community__text">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </div>
          <span class="community__line" aria-hidden="true" />
        </li>
      </ol>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.community {
  background: $lpb-paper;
  color: $lpb-black;
  padding-block: clamp(5rem, 12vw, 9rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
}

.community__inner {
  display: grid;
  gap: clamp(2.5rem, 5vw, 6rem);
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;

  @media (min-width: 960px) {
    grid-template-columns: 0.7fr 1.3fr;
    align-items: start;
  }
}

.community__header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 960px) {
    align-items: center;
    text-align: center;
  }
}

.community__eyebrow {
  color: $lpb-green-dark;
}

.community__title {
  margin: 0;
  font-style: normal;
  line-height: 1;

  @media (max-width: 960px) {
    margin-inline: auto;
  }
}

.community__title--italic {
  font-style: italic;
  color: $lpb-green-dark;
}

.community__list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid rgba($lpb-black, 0.15);
}

.community__row {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem clamp(1rem, 3vw, 2.5rem);
  padding: clamp(1.5rem, 3.5vw, 2.5rem) 0;
  align-items: baseline;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    text-align: center;
    justify-items: center;
  }
}

.community__num {
  font-family: $font-mono;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: $lpb-graphite;
  padding-top: 0.45rem;
}

.community__text {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  h3 {
    font-family: $font-display;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    line-height: 1.15;
    letter-spacing: -0.015em;
    margin: 0;
    color: $lpb-black;
    text-wrap: balance;
  }

  p {
    font-family: $font-sans;
    color: $lpb-graphite;
    line-height: 1.55;
    margin: 0;
    max-width: 65ch;
  }
}

.community__line {
  position: absolute;
  inset: auto 0 0 0;
  height: 1px;
  background: rgba($lpb-black, 0.15);
  grid-column: 1 / -1;
}
</style>
