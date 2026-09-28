<script setup lang="ts">
/** Qué materiales se necesitan para las clases online (texto de Luisa). */
const items = [
  { emoji: '🏋🏻‍♀️', title: 'Un mat o colchoneta' },
  { emoji: '🏋🏻‍♀️', title: 'Pesas' },
  { emoji: '🎀', title: 'Ligas de resistencia' },
]
</script>

<template>
  <section class="equipment">
    <div class="equipment__inner">
      <header class="equipment__header">
        <span class="eyebrow">Tus clases online</span>
        <h2 class="equipment__title display-md">
          ✨ ¿Qué necesitas para <span class="italic-accent">mis clases online?</span> ✨
        </h2>
        <p class="equipment__lede">Para nuestras clases vas a necesitar:</p>
      </header>

      <ul class="equipment__list">
        <li v-for="item in items" :key="item.title" class="equipment__item">
          <span class="equipment__emoji" aria-hidden="true">{{ item.emoji }}</span>
          <span class="equipment__name">{{ item.title }}</span>
        </li>
      </ul>

      <p class="equipment__note">
        Pero si todavía no tienes pesas, ¡no hay problema! 🙌🏻 Puedes reemplazarlas por botellas de agua o cualquier
        objeto que tengas en casa y que puedas sostener con seguridad. 💧💪🏻
      </p>
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

.equipment__emoji {
  font-size: 2.2rem;
  line-height: 1;

  @media (max-width: 720px) {
    font-size: 1.7rem;
  }
}

.equipment__name {
  font-family: $font-display;
  font-size: 1.25rem;
  color: $lpb-black;
}

.equipment__note {
  margin: 0 auto;
  max-width: 62ch;
  padding: 1.25rem 1.5rem;
  font-family: $font-sans;
  font-size: 1rem;
  line-height: 1.6;
  color: $lpb-graphite;
  background: rgba($lpb-green, 0.08);
  border: 1px solid rgba($lpb-green, 0.25);
  border-radius: 1rem;
}
</style>
