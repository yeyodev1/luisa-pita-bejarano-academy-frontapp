<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { gsap } from '@/composables/useScrollReveal'

const faq = [
  {
    q: '¿Cuánto cuesta la comunidad anual?',
    a: 'El precio se anuncia el día que abre la preventa. Por ahora confirmamos que es capital tres cifras (USD) y cubre la comunidad un año entero. Las registradas en la lista VIP reciben un descuento exclusivo que el público general no ve.',
  },
  {
    q: '¿Cuándo abre la preventa?',
    a: 'No tenemos fecha pública aún. Las registradas en la lista VIP reciben aviso 24 horas antes de que abra. Si no estás en la lista, te enteras al mismo tiempo que el resto.',
  },
  {
    q: '¿Por qué un año entero y no un programa corto?',
    a: 'Porque transformar un cuerpo y un estilo de vida toma tiempo. Programas cortos dan resultados que se evaporan. Esta comunidad está hecha para lograr cambios que se sostengan en tu vida real.',
  },
  {
    q: '¿Para quién es y para quién no es?',
    a: 'Es para mujeres ocupadas y dueñas de negocio dispuestas a comprometerse un año entero. No es para quienes buscan dietas restrictivas, atajos o resultados en 8 semanas. La estructura asume que tu vida sigue mientras transformas tu cuerpo.',
  },
  {
    q: '¿Tengo que vivir en Ecuador?',
    a: 'No. La comunidad funciona online. Mujeres en Ecuador, Latinoamérica, USA y Europa pueden participar.',
  },
  {
    q: '¿Y si me registro pero no califico?',
    a: 'No pasa nada. Solo significa que esta cohorte no es para ti hoy. Podrás aplicar a una próxima edición cuando estés lista.',
  },
]

const openIndex = ref<number | null>(null)
const itemEls = ref<(HTMLElement | null)[]>([])
const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const setItemRef = (el: HTMLElement | null, i: number) => {
  itemEls.value[i] = el
}

const toggle = (i: number) => {
  if (openIndex.value === i) {
    closeItem(i)
    openIndex.value = null
  } else {
    if (openIndex.value !== null) closeItem(openIndex.value)
    openIndex.value = i
    nextTick(() => openItem(i))
  }
}

const openItem = (i: number) => {
  const item = itemEls.value[i]
  if (!item) return
  const answer = item.querySelector('.faq__answer') as HTMLElement
  const inner = item.querySelector('.faq__answer-inner') as HTMLElement
  const icon = item.querySelector('.faq__icon') as HTMLElement
  if (!answer || !inner) return

  const tl = gsap.timeline()
  gsap.set(answer, { display: 'block' })
  tl.fromTo(
    answer,
    { height: 0, overflow: 'hidden' },
    { height: inner.scrollHeight, duration: 0.55, ease: 'power4.out', clearProps: 'overflow' },
  )
  tl.fromTo(inner, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, '-=0.15')
  if (icon) {
    tl.to(icon, { rotation: 135, duration: 0.45, ease: 'back.out(1.7)' }, 0)
  }
}

const closeItem = (i: number) => {
  const item = itemEls.value[i]
  if (!item) return
  const answer = item.querySelector('.faq__answer') as HTMLElement
  const inner = item.querySelector('.faq__answer-inner') as HTMLElement
  const icon = item.querySelector('.faq__icon') as HTMLElement
  if (!answer || !inner) return

  const tl = gsap.timeline()
  tl.to(inner, { opacity: 0, y: -8, duration: 0.15, ease: 'power2.in' })
  tl.to(
    answer,
    { height: 0, duration: 0.4, ease: 'power4.inOut', overflow: 'hidden' },
    '-=0.05',
  )
  tl.call(() => gsap.set(answer, { display: 'none' }))
  if (icon) {
    tl.to(icon, { rotation: 0, duration: 0.35, ease: 'power3.out' }, 0)
  }
}

onMounted(() => {
  if (!root.value) return
  ctx = gsap.context(() => {
    gsap.from(root.value!.querySelectorAll('.faq__item'), {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.faq__list', start: 'top 80%' },
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="faq" ref="root">
    <div class="faq__inner">
      <header class="faq__header">
        <span class="eyebrow">Preguntas frecuentes</span>
        <h2 class="faq__title display-md">
          Lo que las decididas <span class="italic-accent">suelen preguntar.</span>
        </h2>
      </header>

      <div class="faq__list">
        <div
          v-for="(item, i) in faq"
          :key="i"
          class="faq__item"
          :class="{ 'faq__item--open': openIndex === i }"
          :ref="(el) => setItemRef(el as HTMLElement | null, i)"
        >
          <button
            class="faq__trigger"
            @click="toggle(i)"
            :aria-expanded="openIndex === i"
            :aria-controls="`faq-answer-${i}`"
          >
            <span class="faq__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="faq__q">{{ item.q }}</span>
            <span class="faq__icon" aria-hidden="true">
              <i class="fa-solid fa-plus"></i>
            </span>
          </button>
          <div class="faq__answer" :id="`faq-answer-${i}`" role="region">
            <div class="faq__answer-inner">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.faq {
  background: $lpb-paper;
  color: $lpb-black;
  padding-block: clamp(5rem, 12vw, 9rem);
  padding-inline: clamp(2.5rem, 9vw, 9rem);
  width: 100%;
}

.faq__inner {
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 5vw, 4rem);
  width: 100%;
  margin-inline: auto;
  max-width: 1440px;
}

.faq__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 1100px;
  margin-inline: auto;
}

.faq__title {
  margin: 0;
  font-style: normal;
}

.faq__list {
  border-top: 1px solid rgba($lpb-black, 0.15);
}

.faq__item {
  border-bottom: 1px solid rgba($lpb-black, 0.15);
}

.faq__trigger {
  cursor: pointer;
  list-style: none;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding-block: clamp(1.2rem, 2.5vw, 1.75rem);
  min-height: 60px;
  width: 100%;
  background: none;
  border: none;
  outline: none;
  text-align: left;
  color: inherit;
  font: inherit;
  -webkit-appearance: none;
  appearance: none;

  &:focus-visible {
    color: $lpb-green-dark;
    outline: 2px solid $lpb-green-dark;
    outline-offset: 4px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    grid-template-columns: 1fr auto;

    .faq__num {
      display: none;
    }
  }
}

.faq__num {
  font-family: $font-mono;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  color: $lpb-graphite;
}

.faq__q {
  font-family: $font-display;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.15rem, 2vw, 1.6rem);
  line-height: 1.25;
  color: $lpb-black;
  letter-spacing: -0.01em;
  text-wrap: balance;
  transition: color .25s ease;
}

.faq__item:hover .faq__q {
  color: $lpb-green-dark;
}

.faq__item--open .faq__q {
  color: $lpb-green-dark;
}

.faq__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba($lpb-black, 0.2);
  color: $lpb-black;
  background: transparent;
  transition: background .25s ease, color .25s ease;

  &:hover {
    background: $lpb-black;
    color: $lpb-green;
  }
}

.faq__item--open .faq__icon {
  background: $lpb-black;
  color: $lpb-green;
}

.faq__answer {
  display: none;
  overflow: hidden;
}

.faq__answer-inner {
  padding-left: calc(0.75rem + 2.2rem);
  padding-bottom: 2rem;

  @media (max-width: 480px) {
    padding-left: 0;
  }

  p {
    font-family: $font-sans;
    color: $lpb-graphite;
    line-height: 1.65;
    margin: 0;
    max-width: 75ch;
  }
}
</style>
