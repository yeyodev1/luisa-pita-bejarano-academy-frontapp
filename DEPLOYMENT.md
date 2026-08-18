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
| Rama por defecto (GitHub) | `develop` — aquí se trabaja y aquí caen los PRs |
| Rama de producción (Vercel) | `main` — fijada explícitamente en el proyecto |
| Flujo | commitear en `develop` → deploy de preview automático → PR `develop` → `main` → producción |
| Env vars | las 7 `VITE_*` cargadas en Production y Preview (gestionar con `vercel env`) |
| Dominio | `luisapitabejarano.com` + `www` → A `76.76.21.21` / CNAME `cname.vercel-dns.com` (DNS-only en Cloudflare) |

> Cambiar el default de GitHub a `develop` **no** afecta producción: Vercel tiene
> `productionBranch: main` guardado en el proyecto. Nada se publica hasta que se mergea a `main`.

## Netlify (legado — NO USAR)

- El sitio de Netlify queda obsoleto; el directorio local `.netlify/` es residuo y está en `.gitignore`.
- Pendiente manual (una sola vez, desde el dashboard de Netlify): desactivar el auto-deploy
  del sitio viejo y apuntar el dominio `luisapitabejarano.com` a Vercel para cortar definitivamente.
