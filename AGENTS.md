# Agent Notes — Luisa Pita Bejarano Web Frontapp

## Stack
- Vue 3 + Vite + TypeScript + SCSS.
- pnpm workspace (single app; `pnpm-workspace.yaml` is present but malformed and can be ignored).
- State: Pinia. Routing: vue-router. Animation: GSAP + ScrollTrigger + Lenis smooth scroll.

## Daily commands
- `pnpm dev` — start Vite dev server.
- `pnpm build` — type-check with `vue-tsc -b` then `vite build`.
- `pnpm preview` — preview production build from `dist/`.

No test, lint, or formatter scripts are configured. Verification is `build` only.

## Architecture
- Entry: `src/main.ts` mounts `#app` from `index.html`.
- Router: `src/router/index.ts`. Route `meta` drives dynamic SEO (title, description, OG, canonical).
- Stores: `src/stores/user.ts` (Pinia, localStorage-backed auth state).
- HTTP: `src/services/httpBase.ts` is the Axios base class; consumes `VITE_API_BASE_URL`.
- Views: `src/views/` (Home, LegalNotice, PrivacyPolicy).
- Components: `src/components/{layout,home,ui}/`.

## Path alias
- `@/` maps to `./src` in both Vite and TypeScript.

## Styles
- `vite.config.ts` auto-injects `@use "@/styles/index.scss" as *;` into every `<style lang="scss">` block.
- `index.scss` forwards color and font variables; use them directly in component SCSS without re-importing.
- `src/styles/global.scss` is imported once in `main.ts` for global/base rules.
- Theme CSS variables live on `:root` / `[data-theme="dark"]` in `global.scss`.

## Environment
- Copy `.env.example` to `.env` for local dev.
- `VITE_API_BASE_URL` defaults to `http://localhost:8100/api` if unset.

## Config gotcha
- Both `vite.config.ts` and `vite.config.js` exist with identical content. Vite prefers `.ts`; `tsconfig.node.json` references only `vite.config.ts`. Treat `.ts` as the source of truth.

## Conventions
- `<script setup lang="ts">` for SFCs.
- Components are PascalCase (`HeroSection.vue`, `AppButton.vue`).
- Page SEO is defined in the route `meta`, not inside components.
- Images are served from Cloudinary (`res.cloudinary.com/dkosgkjpq`).

## Academia (dashboard y admin): reglas que no se deben romper
Backend hermano: `../luisa-pita-bejarano-academy-backapp` (ver su `AGENTS.md`).
Verificación: `npx vue-tsc --noEmit -p tsconfig.app.json` y `pnpm build`.

### Estado de acceso
El backend deja `subscriptionStatus: 'active'` aunque `accessUntil` ya pasó. Nunca muestres
"Activo" solo por ese campo:
- Alumna: usa `userStore.effectiveSubscriptionStatus` (`src/stores/user.ts`).
- Admin › Usuarios: `effectiveStatus()` en `views/admin/AdminUsersView/UsersTable.vue`
  muestra "Vencido" (rojo) si la fecha pasó; el filtro tiene la opción `expired`.

### Valoraciones (`components/assessment/`)
- `CheckpointForm.vue` lo usan la alumna (`views/dashboard/ProgressView`) y el admin
  (`views/admin/AdminAssessmentView`). Recibe la prop `uploadPhoto(file)` porque cada lado
  sube a un endpoint distinto.
- Peso + las 10 medidas son **obligatorios** (`essential: true` en
  `utils/assessmentMetrics.ts`); el backend también lo valida. % grasa, % músculo, pruebas
  físicas y fotos son **opcionales**.
- Fotos: 3 poses (`PHOTO_POSES`), privadas; la `url` firmada viene del backend en cada lectura.
  `AssessmentPhotoGallery.vue` las muestra por mes.

### Recetas
- Admin › Recetas usa `views/admin/AdminRecipesView.vue` (formulario paso a paso), **no** el
  genérico `AdminEntityView.vue`.
- Ingredientes y pasos se escriben uno por línea; se limpian viñetas y números al guardar.
- Vista de la alumna: `views/dashboard/RecipesView.vue`. La carpeta `RecipesView/` es un mock
  viejo, excluido del type-check y sin ruta: no la uses.

### Avisos por correo
Al publicar una receta o una clase grabada el admin ve la casilla "Avisar por correo a las
alumnas activas" (marcada al crear, desmarcada al editar). Se envía `notify: true` y el
backend anuncia una sola vez (`announcedAt`). Si `announcedAt` ya existe, la UI no ofrece la
casilla.

### Editor genérico (`AdminEntityView.vue`)
Lo usan Calendario, Logros y Comentarios. El estado vacío solo aplica en modo `readonly`
(si no, no se podría crear el primer registro) y los errores al guardar van en `saveError`,
junto al formulario.

### Clases grabadas automáticas
Las clases de Zoom las publica el backend (webhook). En Admin › Clases grabadas llevan la
etiqueta "Automática (Zoom)" (`source === 'zoom'`). Subir a mano sigue disponible.

### Backoffice (`views/admin/AdminBackofficeView.vue`, ruta `admin-backoffice`)
Dos pestañas: **Solicitudes** (el equipo del cliente pide cambios; el técnico responde con
notas y cambia el estado) y **Servicios y accesos** (inventario con costo mensual estimado,
pendientes y renovaciones en 30 días). Sin contraseñas: solo a nombre de qué cuenta está cada
servicio. Servicio de API: `services/backofficeService.ts`.
