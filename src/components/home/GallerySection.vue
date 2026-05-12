<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { gsap } from '@/composables/useScrollReveal'

const { luisa } = useCloudinary()

const editorial = [
  {
    src: luisa(2, { w: 800, h: 1050, crop: 'thumb', gravity: 'face' }),
    srcLg: luisa(2, { w: 1400, h: 1850, crop: 'thumb', gravity: 'face' }),
    label: 'Disciplina',
    span: 'half',
  },
  {
    src: luisa(11, { w: 1100, h: 800, crop: 'fill', gravity: 'face' }),
    srcLg: luisa(11, { w: 2000, h: 1450, crop: 'fill', gravity: 'face' }),
    label: 'Presencia',
    span: 'half',
  },
  {
    src: luisa(2, { w: 700, h: 1000, crop: 'thumb', gravity: 'center' }),
    srcLg: luisa(2, { w: 1200, h: 1700, crop: 'thumb', gravity: 'center' }),
    label: 'Cuerpo',
    span: 'third',
  },
  {
    src: luisa(11, { w: 1300, h: 1000, crop: 'fill', gravity: 'center' }),
    srcLg: luisa(11, { w: 2200, h: 1700, crop: 'fill', gravity: 'center' }),
    label: 'Editorial',
    span: 'two-thirds',
  },
  {
    src: luisa(2, { w: 1400, h: 900, crop: 'fill', gravity: 'auto' }),
    srcLg: luisa(2, { w: 2400, h: 1500, crop: 'fill', gravity: 'auto' }),
    label: 'Propósito',
    span: 'full',
  },
]

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    const titleLines = root.value!.querySelectorAll('.gallery__title-line')
    gsap.from(titleLines, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.12,
      scrollTrigger: { trigger: root.value, start: 'top 80%' },
    })

    root.value!.querySelectorAll('.gallery__img').forEach((el) => {
      const img = el.querySelector('img')
      if (!img) return
      gsap.fromTo(
        img,
        { yPercent: -6, scale: 1.04 },
        {
          yPercent: 6,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        },
      )
    })

    root.value!.querySelectorAll('.gallery__item').forEach((el, i) => {
      gsap.from(el.querySelector('.gallery__img'), {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1.4,
        ease: 'power4.out',
        delay: i * 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="gallery" id="historias" ref="root">
    <div class="gallery__container">
      <header class="gallery__header">
        <span class="eyebrow gallery__eyebrow">Editorial</span>
        <h2 class="gallery__title display-md">
          <span class="gallery__title-line">La estética</span>
          <span class="gallery__title-line">de quien se decide.</span>
        </h2>
      </header>

      <div class="gallery__grid">
        <figure
          v-for="(item, i) in editorial"
          :key="i"
          class="gallery__item"
          :class="`gallery__item--${item.span}`"
        >
          <div class="gallery__img">
            <img
              :src="item.src"
              :srcset="`${item.src} 1x, ${item.srcLg} 2x`"
              :alt="`Luisa Pita — ${item.label}`"
              loading="lazy"
            />
            <span class="gallery__img-badge">{{ item.label }}</span>
          </div>
          <figcaption class="gallery__caption">
            <span class="gallery__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="gallery__label">{{ item.label }}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.gallery {
  background: $lpb-paper;
  color: $lpb-black;
  padding-block: clamp(5rem, 12vw, 10rem);
  width: 100%;
}

.gallery__container {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
}

.gallery__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  margin-bottom: clamp(2.5rem, 5vw, 4.5rem);

  @media (min-width: 720px) {
    align-items: flex-start;
    text-align: left;
    padding-inline: clamp(2.5rem, 9vw, 9rem);
  }
}

.gallery__eyebrow {
  color: $lpb-green-dark;
}

.gallery__title {
  margin: 0;
  font-style: italic;
  line-height: 1.05;

  @media (min-width: 720px) {
    max-width: 12ch;
  }
}

.gallery__title-line {
  display: block;
}

.gallery__grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  padding-inline: clamp(2.5rem, 9vw, 9rem);

  @media (min-width: 720px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
  }
}

.gallery__item {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;

  @media (min-width: 720px) {
    gap: 0.85rem;
  }
}

@media (min-width: 720px) {
  .gallery__item--full {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .gallery__item--half { grid-column: span 6; }
  .gallery__item--third { grid-column: span 4; }
  .gallery__item--two-thirds { grid-column: span 8; }
  .gallery__item--full { grid-column: span 12; }
}

.gallery__img {
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  background: rgba($lpb-black, 0.04);
  width: 100%;
  aspect-ratio: 4 / 5;

  @media (min-width: 720px) {
    aspect-ratio: auto;
    min-height: 320px;
  }

  @media (min-width: 1024px) {
    min-height: 400px;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba($lpb-green, 0.08), rgba($lpb-gold, 0.04));
    opacity: 0;
    transition: opacity .5s ease;
    pointer-events: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 1s cubic-bezier(0.2, 0.7, 0, 1);
    will-change: transform;
  }
}

.gallery__item:hover .gallery__img img {
  transform: scale(1.06);
}

.gallery__item:hover .gallery__img::after {
  opacity: 1;
}

.gallery__img-badge {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  font-family: $font-mono;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: $lpb-white;
  background: rgba($lpb-black, 0.6);
  backdrop-filter: blur(6px);
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba($lpb-white, 0.12);
  transition: background .3s ease, border-color .3s ease;
}

.gallery__item:hover .gallery__img-badge {
  background: rgba($lpb-green-dark, 0.85);
  border-color: rgba($lpb-green, 0.4);
}

.gallery__caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem 0 0.5rem;
  border-bottom: 2px solid rgba($lpb-green, 0.15);
  transition: border-color .3s ease;
}

.gallery__item:hover .gallery__caption {
  border-bottom-color: $lpb-green;
}

.gallery__num {
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: $lpb-gold;
}

.gallery__label {
  font-family: $font-display;
  font-style: italic;
  font-size: clamp(0.9rem, 1.4vw, 1.1rem);
  color: $lpb-black;
  transition: color .3s ease;
}

.gallery__item:hover .gallery__label {
  color: $lpb-green-dark;
}
</style>
