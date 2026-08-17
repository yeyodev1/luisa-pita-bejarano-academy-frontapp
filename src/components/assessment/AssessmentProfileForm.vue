<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AssessmentProfile, ProfilePayload } from '@/types/assessment'

const props = defineProps<{
  profile: AssessmentProfile | null
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save', payload: ProfilePayload): void
}>()

const fechaInicial = ref('')
const edad = ref('')
const estaturaCm = ref('')

watch(
  () => props.profile,
  (profile) => {
    fechaInicial.value = profile?.fechaInicial ? profile.fechaInicial.slice(0, 10) : ''
    edad.value = profile?.edad != null ? String(profile.edad) : ''
    estaturaCm.value = profile?.estaturaCm != null ? String(profile.estaturaCm) : ''
  },
  { immediate: true },
)

function submit() {
  emit('save', {
    fechaInicial: fechaInicial.value || null,
    edad: edad.value === '' ? null : Number(edad.value),
    estaturaCm: estaturaCm.value === '' ? null : Number(estaturaCm.value),
  })
}
</script>

<template>
  <form class="apf" @submit.prevent="submit">
    <div class="apf__fields">
      <label class="apf__field">
        <span class="apf__label">Fecha evaluación inicial</span>
        <input v-model="fechaInicial" type="date" class="apf__input" />
      </label>
      <label class="apf__field">
        <span class="apf__label">Edad</span>
        <input v-model="edad" type="number" min="0" step="1" class="apf__input" placeholder="—" />
      </label>
      <label class="apf__field">
        <span class="apf__label">Estatura (cm)</span>
        <input v-model="estaturaCm" type="number" min="0" step="0.1" class="apf__input" placeholder="—" />
      </label>
    </div>
    <button class="apf__save" type="submit" :disabled="saving">
      <i class="fa-solid fa-floppy-disk" />
      {{ saving ? 'Guardando…' : 'Guardar datos' }}
    </button>
  </form>
</template>

<style lang="scss" scoped>
.apf {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.apf__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1 1 auto;
}

.apf__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 140px;
  min-width: 140px;
}

.apf__label {
  font-family: $font-mono;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-muted;
}

.apf__input {
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 0.625rem;
  background: $lpb-white;
  font-family: $font-sans;
  font-size: 0.9rem;
  color: $lpb-ink;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $lpb-green;
  }
}

.apf__save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  background: $lpb-green-deep;
  color: $lpb-white;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: $lpb-green-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
