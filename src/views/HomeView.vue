<script setup lang="ts">
import { onMounted } from 'vue'
import PresaleHero from '@/components/presale/PresaleHero.vue'
import PlansSection from '@/components/presale/PlansSection.vue'
import BenefitsSection from '@/components/presale/BenefitsSection.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import VideoSection from '@/components/home/VideoSection.vue'
import FaqSection from '@/components/home/FaqSection.vue'
import FinalCtaSection from '@/components/home/FinalCtaSection.vue'
import MarqueeText from '@/components/ui/MarqueeText.vue'

onMounted(() => {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: 'Academia Luisa Pita Bejarano',
      content_type: 'product',
    })
  }
})

const marqueeItems = [
  'Un año contigo',
  'Sin dietas restrictivas',
  'Comunidad anual',
  'Mujeres decididas',
  'Online · Ecuador · Latam · USA · Europa',
  'Por invitación',
]
</script>

<template>
  <div class="home">
    <PresaleHero />
    <MarqueeText :items="marqueeItems" theme="green" :speed="42" />
    <PlansSection />
    <BenefitsSection />
    <MarqueeText :items="['No es para todas', 'Si calificas, recibes el aviso primero', 'Compromiso anual real']" theme="dark" :speed="48" />
    <VideoSection />
    <TestimonialsSection />
    <FaqSection />
    <FinalCtaSection />
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: block;
  background: var(--bg);
}
</style>
