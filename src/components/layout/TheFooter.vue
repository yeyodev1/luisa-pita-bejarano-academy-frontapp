<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BrandWordmark from '@/components/ui/BrandWordmark.vue'
import { buildVipUrl, INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/config/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__top">
      <div class="footer__mark">
        <BrandWordmark size="lg" />
        <p class="footer__tagline">
          Un año contigo, un año cerca de Luisa.<br />
          La comunidad anual cerrada para mujeres decididas.
        </p>
      </div>

      <div class="footer__cta">
        <a
          class="footer__cta-link"
          :href="buildVipUrl('footer')"
          target="_blank"
          rel="noopener"
        >
          <span>Solicitar invitación</span>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
    </div>

    <div class="footer__rule" aria-hidden="true" />

    <div class="footer__bottom">
      <nav class="footer__nav">
        <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="footer__link">
          Instagram <em>{{ INSTAGRAM_HANDLE }}</em>
        </a>
        <RouterLink :to="{ name: 'privacy-policy' }" class="footer__link">Políticas de privacidad</RouterLink>
        <RouterLink :to="{ name: 'legal-notice' }" class="footer__link">Aviso legal</RouterLink>
      </nav>
      <p class="footer__copy">© {{ year }} Luisa Pita Bejarano · Ecuador</p>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  background: $lpb-black;
  color: $lpb-white;
  padding-block: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 3vw, 2.5rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
}

.footer__top {
  display: grid;
  gap: 2.5rem;
  align-items: end;
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;

  @media (min-width: 880px) {
    grid-template-columns: 1.4fr 1fr;
    gap: 4rem;
  }
}

.footer__mark {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: $lpb-white;
}

.footer__tagline {
  font-family: $font-display;
  font-style: italic;
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  line-height: 1.3;
  color: rgba($lpb-white, 0.78);
  max-width: 38ch;
}

.footer__cta {
  justify-self: start;

  @media (min-width: 880px) {
    justify-self: end;
  }
}

.footer__cta-link {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 1.7rem;
  border: 1px solid rgba($lpb-white, 0.25);
  border-radius: 999px;
  color: $lpb-white;
  font-family: $font-mono;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background .25s ease, color .25s ease, border-color .25s ease, transform .25s ease;

  &:hover {
    background: $lpb-green;
    color: $lpb-black;
    border-color: $lpb-green;
    transform: translateY(-1px);
  }
}

.footer__rule {
  height: 1px;
  background: rgba($lpb-white, 0.12);
  margin-block: clamp(2rem, 4vw, 3rem);
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;
}

.footer__bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(1rem, 2vw, 1.75rem);
}

.footer__link {
  font-family: $font-mono;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba($lpb-white, 0.65);
  transition: color .25s ease;

  em {
    font-style: normal;
    color: $lpb-green;
  }

  &:hover {
    color: $lpb-white;
  }
}

.footer__copy {
  font-family: $font-mono;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba($lpb-white, 0.45);
  margin: 0;
}
</style>
