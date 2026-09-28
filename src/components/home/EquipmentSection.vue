<script setup lang="ts">
/** Qué materiales se necesitan para las clases online (texto de Luisa). */
const items = [
  { icon: 'fa-rug', tone: 'green', title: 'Un mat o colchoneta' },
  { icon: 'fa-dumbbell', tone: 'gold', title: 'Pesas' },
  { icon: 'fa-ribbon', tone: 'rose', title: 'Ligas de resistencia' },
]
</script>

<template>
  <section class="equipment">
    <div class="equipment__inner">
      <header class="equipment__header">
        <span class="eyebrow">Tus clases online</span>
        <h2 class="equipment__title display-md">
          <i class="fa-solid fa-wand-magic-sparkles equipment__sparkle" aria-hidden="true" />
          ¿Qué necesitas para <span class="italic-accent">mis clases online?</span>
        </h2>
        <p class="equipment__lede">Para nuestras clases vas a necesitar:</p>
      </header>

      <ul class="equipment__list">
        <li v-for="item in items" :key="item.title" class="equipment__item">
          <span class="equipment__icon" :class="`equipment__icon--${item.tone}`" aria-hidden="true">
            <i class="fa-solid" :class="item.icon" />
          </span>
          <span class="equipment__name">{{ item.title }}</span>
        </li>
      </ul>

      <div class="equipment__note">
        <span class="equipment__note-icon" aria-hidden="true"><i class="fa-solid fa-bottle-water" /></span>
        <p>
          <strong>Pero si todavía no tienes pesas, ¡no hay problema!</strong> Puedes reemplazarlas por botellas de agua o
          cualquier objeto que tengas en casa y que puedas sostener con seguridad.
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.equipment {
  background: $lpb-cream;
  color: $lpb-black;
  padding-block: clamp(4rem, 10vw, 7rem);
  padding-inline: clamp(1.5rem, 9vw, 9rem);
  width: 100%;
}

.equipment__inner {
  max-width: 960px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  text-align: center;
}

.equipment__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.equipment__title {
  margin: 0;
  color: $lpb-black;
}

.equipment__lede {
  margin: 0;
  font-family: $font-sans;
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  color: $lpb-graphite;
}

.equipment__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.equipment__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.75rem 1.25rem;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1.25rem;

  @media (max-width: 720px) {
    flex-direction: row;
    justify-content: flex-start;
    padding: 1.1rem 1.25rem;
  }
}

.equipment__sparkle {
  color: $lpb-gold;
  font-size: 0.7em;
  vertical-align: middle;
  margin-right: 0.25rem;
}

.equipment__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  font-size: 1.45rem;

  @media (max-width: 720px) {
    width: 2.9rem;
    height: 2.9rem;
    font-size: 1.2rem;
  }

  &--green {
    background: rgba($lpb-green, 0.14);
    color: $lpb-green-deep;
  }

  &--gold {
    background: rgba($lpb-gold, 0.18);
    color: darken($lpb-gold, 18%);
  }

  &--rose {
    background: #fde7ee;
    color: #d6457a;
  }
}

.equipment__name {
  font-family: $font-display;
  font-size: 1.25rem;
  color: $lpb-black;
}

.equipment__note {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 0 auto;
  max-width: 64ch;
  padding: 1.25rem 1.5rem;
  text-align: left;
  background: rgba($lpb-green, 0.08);
  border: 1px solid rgba($lpb-green, 0.25);
  border-radius: 1rem;

  p {
    margin: 0;
    font-family: $font-sans;
    font-size: 1rem;
    line-height: 1.6;
    color: $lpb-graphite;
  }

  strong {
    color: $lpb-black;
  }
}

.equipment__note-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  background: #e3f1fb;
  color: #2f8fd8;
  font-size: 1.1rem;
}
</style>
