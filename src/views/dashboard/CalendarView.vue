<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import type { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { useDashboardStore } from '@/stores/dashboard'

const ECUADOR_TIMEZONE = 'America/Guayaquil'
const MEETING_URL = 'https://meet.google.com/tik-vsks-pbc'
const store = useDashboardStore()

const weeklySchedule = [
  {
    id: 'luisa-class',
    title: 'Clase de Luisa Pita Bejarano',
    days: 'Lunes a viernes',
    time: '6:00 a. m. - 7:00 a. m.',
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '06:00:00',
    endTime: '07:00:00',
    color: '#536d59',
    icon: 'fa-person-running',
  },
  {
    id: 'cafecito-luisa',
    title: 'Cafecito con Luisa Pita Bejarano',
    days: 'Todos los lunes',
    time: '4:00 p. m. - 5:00 p. m.',
    daysOfWeek: [1],
    startTime: '16:00:00',
    endTime: '17:00:00',
    color: '#a66f32',
    icon: 'fa-mug-hot',
  },
] as const

const recurringEvents: EventInput[] = weeklySchedule.map((event) => ({
  id: event.id,
  title: event.title,
  daysOfWeek: [...event.daysOfWeek],
  startTime: event.startTime,
  endTime: event.endTime,
  backgroundColor: event.color,
  borderColor: event.color,
  extendedProps: { meetingUrl: MEETING_URL },
}))

const calendarEvents = computed<EventInput[]>(() => [
  ...recurringEvents,
  ...store.calendarEvents.map((event) => ({
    id: event._id,
    title: event.title,
    start: event.startsAt,
    ...(event.endsAt ? { end: event.endsAt } : {}),
    extendedProps: {
      meetingUrl: event.meetingUrl,
      description: event.description,
    },
  })),
])

function openMeeting() {
  window.open(MEETING_URL, '_blank', 'noopener')
}

function openEventMeeting({ event }: EventClickArg) {
  const meetingUrl = event.extendedProps.meetingUrl as string | undefined
  if (meetingUrl) window.open(meetingUrl, '_blank', 'noopener')
}

const options = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  locale: esLocale,
  timeZone: ECUADOR_TIMEZONE,
  initialView: window.innerWidth < 720 ? 'listMonth' : 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth',
  },
  buttonText: { today: 'Hoy', month: 'Mes', list: 'Agenda' },
  height: 'auto',
  displayEventTime: true,
  eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
  events: calendarEvents.value,
  eventClick: openEventMeeting,
}))

onMounted(() => store.fetchCalendar())
</script>

<template>
  <div class="calendar-page">
    <header class="calendar-hero">
      <div class="calendar-hero__copy">
        <span class="calendar-hero__eyebrow">Encuentros en vivo</span>
        <h1 class="calendar-hero__title">Tu calendario semanal</h1>
        <p class="calendar-hero__description">
          Organiza tu semana y entra a cada sesión desde el mismo enlace de Google Meet.
        </p>
      </div>
      <div class="calendar-hero__timezone">
        <i class="fa-solid fa-earth-americas" />
        <div>
          <strong>Hora de Ecuador</strong>
          <span>America/Guayaquil · UTC-5</span>
        </div>
      </div>
    </header>

    <section class="schedule" aria-labelledby="weekly-schedule-title">
      <div class="schedule__heading">
        <h2 id="weekly-schedule-title">Horario fijo</h2>
        <span>Las sesiones se repiten cada semana</span>
      </div>

      <div class="schedule__list">
        <article v-for="event in weeklySchedule" :key="event.id" class="schedule-card">
          <div class="schedule-card__icon" :style="{ backgroundColor: event.color }">
            <i class="fa-solid" :class="event.icon" />
          </div>
          <div class="schedule-card__body">
            <span class="schedule-card__days">{{ event.days }}</span>
            <h3>{{ event.title }}</h3>
            <strong>{{ event.time }}</strong>
            <small>Hora Ecuador</small>
          </div>
          <button type="button" class="schedule-card__button" @click="openMeeting">
            <i class="fa-solid fa-video" />
            Abrir Google Meet
          </button>
        </article>
      </div>
    </section>

    <p v-if="store.error" class="calendar-page__error">
      No se pudieron cargar otros eventos. El horario semanal sigue disponible.
      <button type="button" @click="store.fetchCalendar">Reintentar</button>
    </p>

    <section class="calendar" aria-label="Calendario mensual de sesiones">
      <div class="calendar__heading">
        <div>
          <span>Vista mensual</span>
          <h2>Próximas sesiones</h2>
        </div>
        <p><i class="fa-solid fa-clock" /> Todos los horarios están en hora Ecuador</p>
      </div>
      <FullCalendar :options="options" />
      <p class="calendar__hint">
        <i class="fa-solid fa-arrow-pointer" />
        Selecciona una sesión para entrar directamente a Google Meet.
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.calendar-page,
.calendar-hero__copy,
.schedule,
.schedule-card__body,
.calendar {
  display: flex;
  flex-direction: column;
}

.calendar-page { gap: 1.5rem; padding-top: 1rem; }

.calendar-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  color: $lpb-white;
  background: linear-gradient(135deg, $lpb-green-deep, $lpb-black);
  border-radius: 1.5rem;
}

.calendar-hero__copy { gap: 0.5rem; flex: 1 1 420px; }
.calendar-hero__eyebrow { color: $lpb-green; font: 700 0.68rem $font-mono; letter-spacing: 0.12em; text-transform: uppercase; }
.calendar-hero__title { margin: 0; font: 400 clamp(2rem, 5vw, 3.25rem) $font-display; }
.calendar-hero__description { max-width: 58ch; margin: 0; font: 0.95rem/1.6 $font-sans; }

.calendar-hero__timezone {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.15rem;
  color: $lpb-black;
  background: $lpb-green;
  border-radius: 1rem;

  > i { font-size: 1.4rem; }
  div { display: flex; flex-direction: column; gap: 0.1rem; }
  strong { font: 700 0.8rem $font-mono; text-transform: uppercase; }
  span { font: 0.75rem $font-sans; }
}

.schedule { gap: 1rem; }
.schedule__heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem 1rem; }
.schedule__heading h2, .calendar__heading h2 { margin: 0; color: $lpb-black; font: 400 1.5rem $font-display; }
.schedule__heading span { color: $lpb-green-deep; font: 600 0.78rem $font-mono; }
.schedule__list { display: flex; flex-wrap: wrap; gap: 1rem; }

.schedule-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1 1 420px;
  padding: 1.25rem;
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 1.25rem;
}

.schedule-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 3.25rem;
  color: $lpb-white;
  border-radius: 1rem;
}

.schedule-card__body { gap: 0.15rem; flex: 1 1 190px; }
.schedule-card__days { color: $lpb-green-deep; font: 700 0.65rem $font-mono; letter-spacing: 0.08em; text-transform: uppercase; }
.schedule-card__body h3 { margin: 0; color: $lpb-black; font: 400 1.15rem $font-display; }
.schedule-card__body strong { color: $lpb-black; font: 700 0.9rem $font-sans; }
.schedule-card__body small { color: $lpb-green-deep; font: 0.72rem $font-sans; }

.schedule-card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.8rem 1rem;
  color: $lpb-white;
  background: $lpb-green-deep;
  border-radius: 999px;
  font: 700 0.65rem $font-mono;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  &:hover { background: $lpb-black; }
}

.calendar-page__error {
  margin: 0;
  padding: 0.8rem 1rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: 0.8rem;
  font: 0.85rem $font-sans;

  button { color: inherit; font-weight: 700; text-decoration: underline; }
}

.calendar {
  gap: 1rem;
  padding: clamp(0.75rem, 2.5vw, 1.5rem);
  background: $lpb-white;
  border: 1px solid rgba($lpb-green-deep, 0.2);
  border-radius: 1.25rem;
  font-family: $font-sans;
  --fc-button-bg-color: #20231f;
  --fc-button-border-color: #20231f;
  --fc-button-hover-bg-color: #536d59;
  --fc-button-hover-border-color: #536d59;
  --fc-button-active-bg-color: #536d59;
  --fc-button-active-border-color: #536d59;
  --fc-event-bg-color: #536d59;
  --fc-event-border-color: #536d59;
  --fc-today-bg-color: rgba(142, 174, 140, 0.16);
}

.calendar__heading { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
.calendar__heading > div { display: flex; flex-direction: column; gap: 0.2rem; }
.calendar__heading span { color: $lpb-green-deep; font: 700 0.65rem $font-mono; letter-spacing: 0.08em; text-transform: uppercase; }
.calendar__heading p, .calendar__hint { margin: 0; color: $lpb-green-deep; font: 0.78rem $font-sans; }
.calendar__hint { display: flex; align-items: center; gap: 0.4rem; }

:deep(.fc-toolbar) { display: flex; flex-wrap: wrap; gap: 0.75rem; }
:deep(.fc-toolbar-title) { color: $lpb-black; font-family: $font-display; font-size: clamp(1.15rem, 3vw, 1.5rem); }
:deep(.fc-event) { cursor: pointer; border-radius: 0.35rem; padding: 0.1rem 0.2rem; }
:deep(.fc-col-header-cell-cushion), :deep(.fc-daygrid-day-number) { color: $lpb-black; }

@media (max-width: 720px) {
  .calendar-hero { align-items: stretch; }
  .calendar-hero__timezone { width: 100%; }
  .schedule-card { align-items: flex-start; }
  .schedule-card__button { width: 100%; }
  :deep(.fc-header-toolbar) { align-items: flex-start; flex-direction: column; }
  :deep(.fc-toolbar-chunk) { display: flex; }
}
</style>
