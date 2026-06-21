<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (document.querySelector('script[src="https://fast.wistia.com/player.js"]')) return

  const script1 = document.createElement('script')
  script1.src = 'https://fast.wistia.com/player.js'
  script1.async = true
  document.head.appendChild(script1)

  const script2 = document.createElement('script')
  script2.src = 'https://fast.wistia.com/embed/johmj3affk.js'
  script2.async = true
  script2.type = 'module'
  document.head.appendChild(script2)
})
</script>

<template>
  <section class="video-section" id="video">
    <div class="video-section__inner">
      <span class="video-section__eyebrow eyebrow eyebrow--green">Conoce más</span>
      <h2 class="video-section__title display-sm">Mira este video para entenderlo todo</h2>
      <div class="video-section__player">
        <wistia-player
          media-id="johmj3affk"
          aspect="1.7777777777777777"
          class="wistia-embed"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-section {
  padding: 4rem 1.5rem 5rem;
  background: var(--bg);
}

.video-section__inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.video-section__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: #087A50;
}

.video-section__title {
  margin: 0 0 1.5rem;
  max-width: 40ch;
}

.video-section__player {
  width: 100%;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

wistia-player:not(:defined) {
  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/johmj3affk/swatch');
  display: block;
  filter: blur(5px);
  padding-top: 56.25%;
}

wistia-player {
  width: 100%;
  display: block;
}
</style>
