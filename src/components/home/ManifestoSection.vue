<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { gsap } from '@/composables/useScrollReveal'

const { luisa } = useCloudinary()
const portrait = luisa(11, { w: 1200, h: 1500, crop: 'fill', gravity: 'face' })

const root = ref<HTMLElement | null>(null)
const photoEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    if (photoEl.value) {
      gsap.fromTo(
        photoEl.value.querySelector('img'),
        { yPercent: -10, scale: 1.08 },
        {
          yPercent: 10,
          scale: 1.02,
          ease: 'none',
          scrollTrigger: {
            trigger: root.value,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }

    const lines = root.value!.querySelectorAll('.manifesto__line')
    gsap.from(lines, {
      yPercent: 80,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: root.value, start: 'top 70%' },
    })

    gsap.from(root.value!.querySelectorAll('[data-fade]'), {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: root.value, start: 'top 65%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="manifesto" id="filosofia" ref="root">
    <div class="manifesto__inner">
      <div class="manifesto__content">
        <span class="eyebrow" data-fade>Filosofía de marca</span>
        <h2 class="manifesto__title display-lg">
          <span class="manifesto__mask"><span class="manifesto__line">Coaching anual</span></span>
          <span class="manifesto__mask"><span class="manifesto__line">para mujeres</span></span>
          <span class="manifesto__mask"><span class="manifesto__line manifesto__line--italic">empoderadas.</span></span>
        </h2>
        <p class="manifesto__copy lede" data-fade>
          Luisa Pita Bejarano ha construido una metodología de acompañamiento anual para mujeres que
          decidieron dejar de intentar programas cortos. Su enfoque no es la dieta: es el rediseño
          completo de tu relación con el movimiento, la alimentación y tu propio cuerpo.
        </p>
        <p class="manifesto__copy lede" data-fade>
          Es la decisión de dedicarte un año entero — con una entrenadora que te empuja, una
          comunidad cerrada que te sostiene y una metodología probada por más de doscientas mujeres.
          <em>Lo que se construye en doce meses se queda contigo.</em>
        </p>
        <dl class="manifesto__stats" data-fade>
          <div>
            <dt>+200</dt>
            <dd>Mujeres acompañadas</dd>
          </div>
          <div>
            <dt>12</dt>
            <dd>Meses de comunidad</dd>
          </div>
          <div>
            <dt>0</dt>
            <dd>Dietas restrictivas</dd>
          </div>
        </dl>
      </div>

      <figure class="manifesto__photo" ref="photoEl">
        <div class="manifesto__photo-wrap">
          <img :src="portrait" alt="Retrato editorial de Luisa Pita Bejarano" loading="lazy" />
        </div>
        <figcaption>
          <span class="eyebrow">Luisa Pita Bejarano</span>
          <span class="manifesto__caption italic-accent">Coach · Ecuador</span>
        </figcaption>
      </figure>
      <div class="manifesto__deco" aria-hidden="true">
        <span class="manifesto__deco-dot manifesto__deco-dot--1" />
        <span class="manifesto__deco-dot manifesto__deco-dot--2" />
        <span class="manifesto__deco-dot manifesto__deco-dot--3" />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.manifesto {
  position: relative;
  padding-block: clamp(5rem, 12vw, 9rem);
  background: $lpb-cream;
  color: $lpb-black;
  width: 100%;
  overflow: clip;
}

.manifesto__deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.manifesto__deco-dot {
  position: absolute;
  border-radius: 50%;
}

.manifesto__deco-dot--1 {
  top: -8%;
  right: 5%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba($lpb-green, 0.12) 0%, transparent 70%);
}

.manifesto__deco-dot--2 {
  bottom: 5%;
  left: -4%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba($lpb-gold, 0.1) 0%, transparent 70%);
}

.manifesto__deco-dot--3 {
  top: 40%;
  left: 55%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba($lpb-green-dark, 0.08) 0%, transparent 70%);
}

.manifesto__inner {
  display: grid;
  gap: clamp(2.5rem, 6vw, 6rem);
  align-items: center;
  width: 100%;
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  margin-inline: auto;
  max-width: 1440px;

  @media (min-width: 960px) {
    grid-template-columns: 1.15fr 0.85fr;
  }
}

.manifesto__content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  @media (max-width: 960px) {
    align-items: center;
    text-align: center;
  }
}

.manifesto__title {
  margin: 0.5rem 0 0.5rem;
  font-weight: 400;
  line-height: 1.02;
}

.manifesto__mask {
  display: block;
  overflow: hidden;
}

.manifesto__line {
  display: block;
}

.manifesto__line--italic {
  font-style: italic;
  color: $lpb-green-dark;
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0.05em;
    width: 100%;
    height: 0.12em;
    background: linear-gradient(90deg, $lpb-gold, $lpb-green-dark, $lpb-gold);
    border-radius: 2px;
    opacity: 0.5;
  }
}

.manifesto__copy {
  max-width: 65ch;
  margin-inline: 0;
  color: $lpb-graphite;

  @media (max-width: 960px) {
    margin-inline: auto;
  }

  em {
    font-family: $font-display;
    font-style: italic;
    font-weight: 500;
    color: $lpb-black;
  }
}

.manifesto__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin: 1rem 0 0;
  padding-top: 2rem;
  border-top: 1px solid rgba($lpb-black, 0.12);

  @media (max-width: 480px) {
    gap: 0.75rem;
  }

  > div {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  dt {
    font-family: $font-display;
    font-size: clamp(2.2rem, 4.5vw, 3.2rem);
    font-weight: 500;
    line-height: 1;
    color: $lpb-gold;
  }

  dd {
    margin: 0;
    font-family: $font-mono;
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: $lpb-graphite;
    line-height: 1.3;
  }
}

.manifesto__photo {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.manifesto__photo-wrap {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 30px 60px -30px rgba($lpb-black, 0.4);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
    will-change: transform;
  }
}

.manifesto__photo figcaption {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.manifesto__caption {
  font-size: 1.1rem;
  color: $lpb-black;
}
</style>
