<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { gsap } from '@/composables/useScrollReveal'
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/config/site'

const { luisa } = useCloudinary()
const portrait = luisa(2, { w: 1200, h: 1500, crop: 'fill', gravity: 'face' })

const root = ref<HTMLElement | null>(null)
const photoEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    if (photoEl.value) {
      gsap.fromTo(
        photoEl.value.querySelector('img'),
        { yPercent: -8, scale: 1.06 },
        {
          yPercent: 8,
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

    gsap.from(root.value!.querySelectorAll('[data-rise]'), {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: root.value, start: 'top 70%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="authority" ref="root">
    <div class="authority__inner">
      <figure class="authority__photo" ref="photoEl">
        <div class="authority__photo-wrap">
          <img :src="portrait" alt="Luisa Pita Bejarano" loading="lazy" />
        </div>
      </figure>

      <div class="authority__content">
        <span class="eyebrow" data-rise>Sobre Luisa Pita Bejarano</span>
        <h2 class="authority__title display-md" data-rise>
          <span class="italic-accent">Coach fitness y entrenadora personal</span> para mujeres con vidas que no caben en un plan de 8 semanas.
        </h2>
        <p class="authority__copy" data-rise>
          <strong>Luisa Pita Bejarano</strong> es coach fitness y entrenadora personal especializada en
          mujeres adultas empoderadas. Ha guiado a más de 200 mujeres en Ecuador, Latinoamérica, USA
          y Europa en procesos de transformación corporal sostenidos — sin dietas restrictivas, sin
          rutinas imposibles, sin efecto rebote.
        </p>
        <p class="authority__copy" data-rise>
          Su comunidad anual cerrada es la evolución natural de su trabajo: dejar de empujar a sus
          alumnas en bloques cortos para acompañarlas <em>un año completo</em>, con la profundidad
          que ese tiempo permite. Mujeres ocupadas, dueñas de negocio, madres y profesionales que
          buscan resultados duraderos sin sacrificar su vida real.
        </p>

        <ul class="authority__pills" data-rise>
          <li>+200 mujeres acompañadas</li>
          <li>Online · Ecuador, Latam, USA, Europa</li>
          <li>Sin dietas restrictivas</li>
        </ul>

        <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="authority__instagram" data-rise>
          <i class="fa-brands fa-instagram" aria-hidden="true" style="font-size: 1.2rem;"></i>
          <span>{{ INSTAGRAM_HANDLE }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.authority {
  background: $lpb-cream;
  color: $lpb-black;
  padding-block: clamp(5rem, 12vw, 9rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
}

.authority__inner {
  display: grid;
  gap: clamp(2.5rem, 6vw, 6rem);
  align-items: center;
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;

  @media (min-width: 960px) {
    grid-template-columns: 1fr 1.05fr;
  }
}

.authority__photo {
  margin: 0;
  order: 2;

  @media (min-width: 960px) {
    order: 0;
  }
}

.authority__photo-wrap {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 30px 60px -20px rgba($lpb-black, 0.35);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%;
    will-change: transform;
  }
}

.authority__content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  @media (max-width: 960px) {
    align-items: center;
    text-align: center;
  }
}

.authority__title {
  margin: 0.5rem 0 0.5rem;
  font-weight: 400;
  font-style: normal;
  line-height: 1.1;
}

.authority__copy {
  font-family: $font-sans;
  font-size: 1.05rem;
  line-height: 1.65;
  color: $lpb-graphite;
  max-width: 56ch;

  em {
    font-family: $font-display;
    font-style: italic;
    font-weight: 500;
    color: $lpb-black;
  }
}

.authority__pills {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;

  li {
    font-family: $font-mono;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.5rem 0.9rem;
    border: 1px solid rgba($lpb-black, 0.2);
    border-radius: 999px;
    color: $lpb-graphite;
  }
}

.authority__instagram {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: $lpb-black;
  font-family: $font-mono;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 0.5rem;
  transition: color .25s ease, gap .25s ease;
  width: max-content;

  &:hover {
    color: $lpb-green-dark;
    gap: 0.9rem;
  }
}
</style>
