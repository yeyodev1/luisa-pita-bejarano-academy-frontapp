<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { gsap } from 'gsap'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'
import { buildVipUrl, SITE_COPY, INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/config/site'

const scrolled = ref(false)
const open = ref(false)
const route = useRoute()
const menuContainer = ref<HTMLElement | null>(null)

const onScroll = () => {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const toggle = () => {
  open.value = !open.value
  document.body.style.overflow = open.value ? 'hidden' : ''
}

const close = () => {
  if (!open.value) return
  open.value = false
  document.body.style.overflow = ''
}

// Animación GSAP solo para Mobile
watch(open, async (val) => {
  if (val && window.innerWidth < 880) {
    await nextTick()
    const links = menuContainer.value?.querySelectorAll('.nav__link, .nav__cta, .nav__mobile-footer')
    if (links) {
      gsap.fromTo(links, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.05, 
          ease: 'power2.out',
          clearProps: 'all' 
        }
      )
    }
  }
})

watch(() => route.path, close)
</script>

<template>
  <header class="nav" :class="{ 'nav--scrolled': scrolled, 'nav--open': open, 'nav--legal': route.name !== 'home' }">
    <div class="nav__inner">
      <!-- Brand -->
      <RouterLink :to="{ name: 'home' }" class="nav__brand" @click="close">
        <BrandWordmark size="sm" />
      </RouterLink>

      <!-- Navigation Wrapper -->
      <div class="nav__content" :class="{ 'nav__content--open': open }" ref="menuContainer">
        <nav class="nav__links">
          <a href="#filosofia" class="nav__link" @click="close"><span class="nav__num">01.</span> Filosofía</a>
          <a href="#metodologia" class="nav__link" @click="close"><span class="nav__num">02.</span> Metodología</a>
          <a href="#comunidad" class="nav__link" @click="close"><span class="nav__num">03.</span> Comunidad</a>
          <a href="#historias" class="nav__link" @click="close"><span class="nav__num">04.</span> Historias</a>
          
          <a :href="buildVipUrl('nav')" class="nav__cta" @click="close">
            <span>{{ SITE_COPY.ctaPrimary }}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </nav>

        <!-- Solo visible en Mobile Overlay -->
        <div class="nav__mobile-footer">
          <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="nav__social">
            Instagram {{ INSTAGRAM_HANDLE }}
          </a>
          <p class="nav__copy">© {{ new Date().getFullYear() }} Luisa Pita Bejarano</p>
        </div>
      </div>

      <!-- Burger -->
      <button class="nav__burger" type="button" @click="toggle" :aria-label="open ? 'Cerrar' : 'Menu'">
        <span />
        <span />
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/* --- MOBILE FIRST DESIGN --- */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  padding-block: 1.2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: $lpb-black;

  &:not(.nav--scrolled):not(.nav--legal):not(.nav--open) {
    color: $lpb-white;
  }

  &--scrolled, &--legal, &--open {
    background: rgba($lpb-paper, 0.95);
    backdrop-filter: blur(12px);
    padding-block: 0.8rem;
    border-bottom: 1px solid rgba($lpb-black, 0.05);
  }
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: clamp(1.2rem, 5vw, 2.5rem);
  max-width: 1440px;
  margin: 0 auto;
}

.nav__brand {
  z-index: 1100;
  position: relative;
}

.nav__burger {
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 1100;
  cursor: pointer;

  span {
    width: 24px;
    height: 2px;
    background: currentColor;
    transition: transform 0.3s ease;
  }

  .nav--open & {
    span:nth-child(1) { transform: translateY(4px) rotate(45deg); }
    span:nth-child(2) { transform: translateY(-4px) rotate(-45deg); }
  }
}

/* El contenedor que es "Absolute" en mobile y "Static" en desktop */
.nav__content {
  position: fixed;
  inset: 0;
  background: $lpb-paper;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  z-index: 1050;
  
  // Estado oculto mobile
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s ease;

  &--open {
    opacity: 1;
    visibility: visible;
  }
}

.nav__links {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.nav__link {
  font-family: $font-display;
  font-size: 2.2rem;
  font-weight: 500;
  color: $lpb-black;
  text-decoration: none;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba($lpb-black, 0.05);
  transition: opacity 0.3s ease;

  .nav__num {
    font-size: 0.4em;
    opacity: 0.4;
    margin-right: 0.5rem;
    font-family: $font-mono;
  }
}

.nav__cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $lpb-black;
  color: $lpb-white;
  padding: 1.2rem 2rem;
  border-radius: 999px;
  font-family: $font-mono;
  text-transform: uppercase;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.nav__mobile-footer {
  margin-top: 4rem;
  text-align: center;
  font-family: $font-mono;
  text-transform: uppercase;
  font-size: 0.7rem;
  opacity: 0.4;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* --- DESKTOP TRANSFORMATION (min-width: 880px) --- */
@media (min-width: 880px) {
  .nav__inner {
    padding-inline: clamp(2.5rem, 9vw, 9rem);
  }

  .nav__burger, .nav__mobile-footer {
    display: none !important;
  }

  .nav__content {
    position: static;
    background: transparent;
    padding: 0;
    opacity: 1 !important;
    visibility: visible !important;
    display: flex;
    flex-direction: row;
    height: auto;
    width: auto;
  }

  .nav__links {
    flex-direction: row;
    max-width: none;
    gap: 2.5rem;
    align-items: center;
  }

  .nav__link {
    font-family: $font-sans;
    font-size: 0.9rem;
    font-weight: 450;
    padding: 0;
    border: none;
    opacity: 0.7;

    &:hover { opacity: 1; }
    
    .nav__num { display: none; }
  }

  .nav__cta {
    background: $lpb-black;
    color: $lpb-white;
    padding: 0.7rem 1.4rem;
    font-size: 0.75rem;
    margin-top: 0;
    gap: 0.6rem;

    .nav:not(.nav--scrolled):not(.nav--legal) & {
      background: $lpb-white;
      color: $lpb-black;
    }
  }
}
</style>
