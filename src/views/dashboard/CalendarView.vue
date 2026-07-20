<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { useDashboardStore } from '@/stores/dashboard'
import ApiState from '@/components/ui/ApiState.vue'
const store=useDashboardStore()
const options=computed(()=>({plugins:[dayGridPlugin,listPlugin,interactionPlugin],locale:esLocale,initialView:window.innerWidth<720?'listMonth':'dayGridMonth',headerToolbar:{left:'prev,next today',center:'title',right:'dayGridMonth,listMonth'},height:'auto',events:store.calendarEvents.map(event=>({id:event._id,title:event.title,start:event.startsAt,...(event.endsAt?{end:event.endsAt}:{}),extendedProps:{meetingUrl:event.meetingUrl,description:event.description}})),eventClick:({event}:{event:{extendedProps:{meetingUrl?:string}}})=>{if(event.extendedProps.meetingUrl) window.open(event.extendedProps.meetingUrl,'_blank','noopener')}}))
onMounted(()=>store.fetchCalendar())
</script>
<template><ApiState :loading="store.loading" :error="store.error" :empty="!store.calendarEvents.length" empty-text="No hay eventos programados." @retry="store.fetchCalendar"><div class="calendar"><FullCalendar :options="options"/><p>Selecciona un evento para abrir su enlace de Meet cuando esté disponible.</p></div></ApiState></template>
<style lang="scss" scoped>
.calendar{background:$lpb-white;border:1px solid var(--border);padding:1rem;border-radius:1rem;--fc-button-bg-color:#20231f;--fc-button-border-color:#20231f;--fc-button-active-bg-color:#536d59;--fc-event-bg-color:#536d59;--fc-event-border-color:#536d59;--fc-today-bg-color:rgba(142,174,140,.12);font-family:$font-sans}.calendar p{color:$lpb-muted;font-size:.8rem;margin:1rem 0 0}@media(max-width:640px){.calendar{padding:.5rem}:deep(.fc-header-toolbar){align-items:flex-start;gap:.6rem;flex-direction:column}:deep(.fc-toolbar-chunk){display:flex}:deep(.fc-toolbar-title){font-size:1.2rem}}
</style>
