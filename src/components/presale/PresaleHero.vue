<script setup lang="ts">
import { useCloudinary } from '@/composables/useCloudinary'
import AppButton from '@/components/ui/AppButton.vue'

const { luisa } = useCloudinary()

const heroImage = luisa(11, { w: 1600, h: 2200, crop: 'fill', gravity: 'face' })
const heroImageSm = luisa(11, { w: 720, h: 1100, crop: 'fill', gravity: 'face' })
const heroImageMd = luisa(11, { w: 1100, h: 1500, crop: 'fill', gravity: 'face' })
const heroImageLg = luisa(11, { w: 2000, h: 2600, crop: 'fill', gravity: 'face' })

const scrollToPlans = () => {
  const el = document.getElementById('planes')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

</script>

<template>
  <section class="presale-hero" data-theme="dark">
    <div class="presale-hero__media">
      <img
        class="presale-hero__image"
        :src="heroImage"
        :srcset="`${heroImageSm} 720w, ${heroImageMd} 1100w, ${heroImage} 1600w, ${heroImageLg} 2000w`"
        sizes="100vw"
        alt="Luisa Pita Bejarano — comunidad anual de transformación corporal"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        width="1600"
        height="2200"
      />
      <div class="presale-hero__veil" aria-hidden="true" />
    </div>

    <div class="presale-hero__inner">
      <span class="presale-hero__eyebrow eyebrow eyebrow--green">
        <span class="presale-hero__dot" aria-hidden="true" />
        Inscripciones abiertas
      </span>

      <h1 class="presale-hero__title display-xl">
        Elige tu plan y empieza hoy
      </h1>

      <p class="presale-hero__lede">
        Accede a la academia junto a Luisa para transformar tu cuerpo y tu vida.
        Elige entre 1, 3, 6 o 12 meses de acompañamiento, entrenamiento y nutrición.
      </p>

      <div class="presale-hero__cta-row">
        <AppButton variant="primary" size="lg" @click="scrollToPlans">
          Ver planes y comprar
        </AppButton>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.presale-hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: flex-end;
  padding-block: clamp(6.5rem, 14vh, 9rem) clamp(2rem, 6vw, 4.5rem);
  background: $lpb-black;
  color: $lpb-white;
  overflow: hidden;
  isolation: isolate;
}

.presale-hero__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: clip;
}

.presale-hero__image {
  position: absolute;
  inset: -10% 0;
  width: 100%;
  height: 120%;
  object-fit: cover;
  object-position: center 25%;
  background-color: $lpb-black;
}

.presale-hero__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 80% at 50% 110%, rgba($lpb-black, 0.95) 30%, rgba($lpb-black, 0.35) 70%, rgba($lpb-black, 0) 100%),
    linear-gradient(180deg, rgba($lpb-black, 0.65) 0%, rgba($lpb-black, 0.2) 40%, rgba($lpb-black, 0.85) 100%);
}

.presale-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 1.6vw, 1.5rem);
  width: 100%;
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  margin-inline: auto;
  max-width: 1440px;

  @media (max-width: 720px) {
    align-items: center;
    text-align: center;
  }
}

.presale-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: $lpb-green;
  width: max-content;

  @media (max-width: 720px) {
    margin-inline: auto;
  }
}

.presale-hero__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $lpb-green;
  box-shadow: 0 0 0 4px rgba($lpb-green, 0.25);
  animation: pulse 1.8s ease-in-out infinite;
}

@keyframes pulse {
  50% { box-shadow: 0 0 0 10px rgba($lpb-green, 0); }
}

.presale-hero__title {
  margin: 0;
  color: $lpb-white;
  max-width: 16ch;

  @media (max-width: 720px) {
    margin-inline: auto;
  }
}

.presale-hero__lede {
  font-family: $font-sans;
  font-size: clamp(1.05rem, 1.5vw, 1.3rem);
  line-height: 1.55;
  color: rgba($lpb-white, 0.78);
  max-width: 52ch;
  margin: 0;

  @media (max-width: 720px) {
    margin-inline: auto;
  }
}

.presale-hero__cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
  margin-top: clamp(1rem, 2vw, 1.75rem);

  @media (max-width: 720px) {
    justify-content: center;
    margin-inline: auto;
  }

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1.1rem;

    :deep(.btn) {
      width: 100%;
      justify-content: space-between;
    }
  }
}

</style>
