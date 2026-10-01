<script setup lang="ts">
import { computed } from 'vue'
import type { PhysicalAssessment } from '@/types/assessment'
import { PHOTO_POSES, checkpointLabel, sortedCheckpoints } from '@/utils/assessmentMetrics'

const props = defineProps<{ assessment: PhysicalAssessment }>()

/** Solo los meses con al menos una foto, en orden. */
const rows = computed(() =>
  sortedCheckpoints(props.assessment)
    .filter((cp) => cp.photos?.length)
    .map((cp) => ({
      id: cp._id,
      label: checkpointLabel(cp.monthIndex),
      photos: PHOTO_POSES.map((slot) => ({
        ...slot,
        url: cp.photos?.find((p) => p.pose === slot.pose)?.url ?? null,
      })),
    })),
)
</script>

<template>
  <div v-if="rows.length" class="apg">
    <div v-for="row in rows" :key="row.id" class="apg__row">
      <span class="apg__label">{{ row.label }}</span>
      <div class="apg__photos">
        <template v-for="photo in row.photos" :key="photo.pose">
          <a
            v-if="photo.url"
            :href="photo.url"
            target="_blank"
            rel="noopener"
            class="apg__photo"
            :title="`${row.label} · ${photo.label}`"
          >
            <img :src="photo.url" :alt="`${row.label}, ${photo.label.toLowerCase()}`" loading="lazy" />
            <span>{{ photo.label }}</span>
          </a>
          <div v-else class="apg__photo apg__photo--empty">
            <i class="fa-solid fa-camera" />
            <span>{{ photo.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
  <p v-else class="apg__empty">
    Aún no hay fotos. Son opcionales: puedes agregarlas al crear o editar un registro.
  </p>
</template>

<style lang="scss" scoped>
.apg {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.apg__row {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.apg__label {
  font-family: $font-sans;
  font-size: 0.9rem;
  font-weight: 700;
  color: $lpb-black;
}

.apg__photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 160px));
  gap: 0.75rem;
}

.apg__photo {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 0.9rem;
  overflow: hidden;
  background: $lpb-cream;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    position: absolute;
    left: 0.5rem;
    bottom: 0.5rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: rgba($lpb-black, 0.65);
    color: $lpb-white;
    font-family: $font-sans;
    font-size: 0.72rem;
    font-weight: 600;
  }

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba($lpb-muted, 0.6);
    border: 1px dashed rgba($lpb-green-deep, 0.2);
  }
}

.apg__empty {
  margin: 0;
  font-family: $font-sans;
  font-size: 0.88rem;
  color: $lpb-muted;
}

@media (max-width: 640px) {
  .apg__photos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
