# Deployment — SOLO VERCEL

> **⚠️ NETLIFY ESTÁ ABANDONADO. No usar, no configurar, no deployar ahí.**

Desde el 17 de agosto de 2026 este frontend se deploya **exclusivamente en Vercel**,
igual que el backend (`luisa-pita-bejarano-backapp`).

## Configuración actual

| | |
|---|---|
| Proyecto Vercel | `luisa-pita-bejarano-academy-frontapp` |
| Team | `proyectos-de-diego` (`team_ZB0eFNsqFQo6bL8QgAMAWUHa`) |
| Repo | `yeyodev1/luisa-pita-bejarano-academy-frontapp` |
| Rama de producción | `main` |
| Flujo | trabajar en `develop` → PR → merge a `main` → deploy automático a producción |
| Env vars | las 7 `VITE_*` cargadas en Production y Preview (gestionar con `vercel env`) |

## Netlify (legado — NO USAR)

- El sitio de Netlify queda obsoleto; el directorio local `.netlify/` es residuo y está en `.gitignore`.
- Pendiente manual (una sola vez, desde el dashboard de Netlify): desactivar el auto-deploy
  del sitio viejo y apuntar el dominio `luisapitabejarano.com` a Vercel para cortar definitivamente.
