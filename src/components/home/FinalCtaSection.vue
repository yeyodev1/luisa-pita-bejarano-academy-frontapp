<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/composables/useScrollReveal'
import { buildVipUrl } from '@/config/site'
import AppButton from '@/components/ui/AppButton.vue'

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    gsap.from(root.value!.querySelectorAll('.final-cta__line > *'), {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: root.value, start: 'top 75%' },
    })

    gsap.from(root.value!.querySelectorAll('[data-fade]'), {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power3.out',
      delay: 0.4,
      stagger: 0.08,
      scrollTrigger: { trigger: root.value, start: 'top 75%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="final-cta" ref="root">
    <div class="final-cta__inner">
      <span class="eyebrow eyebrow--green" data-fade>Por invitación</span>
      <h2 class="final-cta__title display-xl">
        <span class="final-cta__line"><span>¿Estás lista</span></span>
        <span class="final-cta__line"><span>para</span></span>
        <span class="final-cta__line"><span class="final-cta__italic">un año contigo?</span></span>
      </h2>

      <p class="final-cta__lede" data-fade>
        No es para todas. Si calificas, recibes el aviso primero,
        un código de descuento exclusivo y tu cupo en la lista VIP.
      </p>

      <div class="final-cta__cta" data-fade>
        <AppButton :href="buildVipUrl('final-cta')" variant="primary" size="lg">
          Únete a la comunidad
        </AppButton>
      </div>

      <ul class="final-cta__details" data-fade>
        <li><span>·</span> Mujeres ocupadas y dueñas de negocio</li>
        <li><span>·</span> Compromiso anual real</li>
        <li><span>·</span> Capital tres cifras</li>
      </ul>
    </div>

    <div class="final-cta__glow" aria-hidden="true" />
    <div class="final-cta__glow--gold" aria-hidden="true" />
  </section>
</template>

<style lang="scss" scoped>
.final-cta {
  position: relative;
  background: $lpb-black;
  color: $lpb-white;
  padding-block: clamp(6rem, 14vw, 12rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
  overflow: clip;
  isolation: isolate;
}

.final-cta__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;
}

.final-cta__title {
  margin: 0;
  font-style: normal;
  color: $lpb-white;
  max-width: none;
}

.final-cta__line {
  display: block;
  overflow: hidden;

  > span {
    display: inline-block;
  }
}

.final-cta__italic {
  font-style: italic;
  color: $lpb-green;
}

.final-cta__lede {
  font-family: $font-display;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.15rem, 1.8vw, 1.45rem);
  line-height: 1.45;
  color: rgba($lpb-white, 0.75);
  max-width: 65ch;
  margin: 0.75rem auto 1.25rem;
  text-wrap: balance;
}

.final-cta__cta {
  margin-top: 0.5rem;
}

.final-cta__details {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.75rem;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-family: $font-mono;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba($lpb-white, 0.6);

    span {
      color: $lpb-green;
      font-size: 1.1em;
    }
  }
}

.final-cta__glow {
  position: absolute;
  inset: auto -10% -50% -10%;
  height: 90%;
  background: radial-gradient(50% 50% at 50% 50%, rgba($lpb-green, 0.22) 0%, rgba($lpb-green, 0) 70%);
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
}

.final-cta__glow--gold {
  position: absolute;
  inset: -20% -10% auto -10%;
  height: 60%;
  background: radial-gradient(50% 50% at 50% 50%, rgba($lpb-gold, 0.12) 0%, rgba($lpb-gold, 0) 60%);
  filter: blur(50px);
  z-index: 0;
  pointer-events: none;
}
</style>
