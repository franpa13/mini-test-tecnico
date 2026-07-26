# mini-test-tecnico

Mini-reto técnico para el proceso de selección de **Nacer Digital**: una aplicación fullstack que muestra información pública de perfiles de GitHub, consumida siempre a través de un backend propio (nunca directo desde el navegador a la API de GitHub).

## 🔗 Demo

| | |
|---|---|
| **Frontend** | https://mini-test-tecnico.vercel.app |
| **Backend (API)** | https://mini-test-tecnico-production.up.railway.app |
| **Repo** | https://github.com/franpa13/mini-test-tecnico |

## Qué hace la app

Al entrar, la página ya muestra el perfil de GitHub del autor (`franpa13`) cargado sin interacción del usuario. Desde ahí se puede:

- 🔍 **Buscar cualquier usuario de GitHub** por username, sin recargar la página.
- 👤 **Ver su perfil**: avatar, nombre, bio, ubicación, empresa, blog, email, disponibilidad laboral y estadísticas (repos, seguidores, siguiendo, gists).
- 🕓 **Ver su actividad reciente**: timeline de eventos públicos (push, ramas creadas, issues, PRs, releases) agrupados por repositorio en un acordeón.
- 📦 **Ver sus repositorios**: lenguaje, estrellas, forks, watchers, licencia y tamaño.
- 🌓 **Cambiar entre tema claro y oscuro**, con el botón al lado del buscador.

## Cómo se resolvió cada requisito de la consigna

| Requisito | Cómo se cumplió |
|---|---|
| Backend en **NestJS** con `GET /user/:username` que consulte la API pública de GitHub | Implementado en `server/src/modules/user/`. Mapea `GET https://api.github.com/users/:username` y devuelve nombre, bio, avatar, ubicación, empresa, blog, email, disponibilidad laboral, repos públicos, gists, seguidores, siguiendo y fechas — "cualquier información disponible", como pide la consigna |
| Frontend en **Next.js** que muestre esos datos al cargar, usando el endpoint propio | `app/page.tsx` (Server Component) llama a `getGithubProfile()` desde el servidor y renderiza el resultado — nunca se le pega a `api.github.com` desde el cliente, siempre a través del backend propio |
| Desplegar backend y frontend | Backend en **Railway**, frontend en **Vercel** (links arriba) |
| Repositorio público | ✅ |

Por encima de lo mínimo pedido se sumaron dos endpoints más (`/repos` y `/activity`) y la posibilidad de buscar el perfil de **cualquier** usuario, no solo el propio.

## Arquitectura

Backend y frontend son dos proyectos independientes (cada uno con su propio `package.json`), organizados por **feature/dominio** en vez de por tipo de archivo:

```
mini-test-tecnico/
├── client/     # Next.js (App Router) + Tailwind CSS 4 + React 19
└── server/     # NestJS 11
```

- **Backend:** `server/src/modules/user/` agrupa todo lo relacionado a esta feature (controller, service, cliente HTTP, DTOs).
- **Frontend:** `client/src/features/github-profile/` agrupa componentes, servicios y tipos propios de esta feature; `client/src/shared/` es lo que reutilizan dos o más partes de la app.

El detalle completo de convenciones y decisiones técnicas está en [CLAUDE.md](CLAUDE.md).

## Stack y cómo se usó cada pieza

### Backend — NestJS 11 + TypeScript

| Tecnología | Uso concreto en este proyecto |
|---|---|
| **NestJS** (Controllers, Services, Modules) | Arquitectura modular: el controller solo define rutas y delega; el service traduce datos crudos de GitHub a DTOs propios y errores a `HttpException` |
| **`@nestjs/config`** | Lectura tipada de variables de entorno (`PORT`, `CORS_ORIGIN`, `GITHUB_API_URL`, `GITHUB_TOKEN`) vía `ConfigService`, en vez de `process.env` disperso por el código |
| **Interceptors** (`APP_INTERCEPTOR`) | `ResponseInterceptor` envuelve toda respuesta exitosa en un formato uniforme: `{ success, statusCode, data, timestamp, path }` |
| **Exception Filters** (`APP_FILTER`) | `HttpExceptionFilter` hace lo mismo para errores: `{ success, statusCode, message, error, timestamp, path }`, sea un 404 de usuario inexistente, un 429 de rate limit de GitHub, o cualquier excepción no manejada |
| **Middleware** | `LoggerMiddleware` loguea método, ruta, status code y duración de cada request |
| **`fetch` nativo (Node 22)** | El cliente HTTP hacia la API de GitHub usa `fetch` global, sin dependencias extra tipo axios |

### Frontend — Next.js 16 (App Router) + React 19

| Tecnología / feature de Next.js | Uso concreto en este proyecto |
|---|---|
| **Server Components + `async`/`await` en el render** | `app/page.tsx` es un Server Component `async` que llama a los tres servicios (`getGithubProfile`, `getGithubRepos`, `getGithubActivity`) directamente en el servidor con `Promise.all` — el HTML ya llega con los datos, sin loading spinner en la carga inicial |
| **`export const dynamic = 'force-dynamic'`** | Fuerza que la página se renderice en cada request en vez de quedar "congelada" con los datos del momento del build — tiene sentido porque el contenido es en vivo (perfil de GitHub) |
| **Client Components (`"use client"`)** | Solo donde hace falta interactividad real: el buscador (`profile-search-banner.tsx`), el estado que orquesta la búsqueda (`profile-explorer.tsx`) y el acordeón de actividad. El resto son Server Components por default |
| **`next/image` con `images.remotePatterns`** | Los avatares de GitHub (`avatars.githubusercontent.com`) se sirven optimizados; hubo que whitelistear ese host en `next.config.ts` |
| **`next/font` (Geist)** | Carga de fuentes optimizada, sin flash de fuente sin estilos |
| **Variables `NEXT_PUBLIC_*`** | `NEXT_PUBLIC_API_URL` es la forma en que el código que corre en el navegador sabe a qué backend pegarle |

### UI

- **Tailwind CSS 4** para todo el estilado.
- **shadcn/ui** sobre **`@base-ui/react`** (no Radix): `Button`, `Input`, `Card`, `Accordion`, generados con `pnpm dlx shadcn@latest add <componente>`.
- **next-themes** para el tema claro/oscuro (persistido, respeta la preferencia del sistema operativo por default).
- **lucide-react** para los íconos.

### Gestor de paquetes

**pnpm** en ambos proyectos.

## Cómo correrlo localmente

### Requisitos previos

- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Git

### 1. Instalar dependencias

```bash
cd server && pnpm install
cd ../client && pnpm install
```

### 2. Configurar variables de entorno

Cada proyecto tiene un `.env.example` (commiteado) como plantilla — los `.env`/`.env.local` reales no se suben (están en `.gitignore`).

```bash
cd server && cp .env.example .env
cd ../client && cp .env.example .env.local
```

**server/.env**

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto donde escucha el backend. |
| `CORS_ORIGIN` | `http://localhost:4001` | Origen permitido por CORS (la URL del frontend). |
| `GITHUB_API_URL` | `https://api.github.com` | Base URL de la API pública de GitHub. |
| `GITHUB_TOKEN` | *(vacío)* | Opcional. Personal Access Token de GitHub (classic, sin scopes) para subir el rate limit de 60 a 5000 req/hora. No es obligatorio. |

**client/.env.local**

| Variable | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL base del backend, **sin** path ni barra final. |

> Se usan los puertos `4000`/`4001` en vez de `3000`/`3001` por un conflicto puntual con Docker Desktop en la máquina de desarrollo — son solo defaults, se pueden cambiar.

### 3. Levantar ambas apps

Dos terminales:

```bash
# Backend — http://localhost:4000
cd server
pnpm start:dev
```

```bash
# Frontend — http://localhost:4001
cd client
pnpm dev
```

### Scripts disponibles

**server/**

| Script | Descripción |
|---|---|
| `pnpm start:dev` | Levanta la app en modo watch |
| `pnpm build` | Compila a `dist/` |
| `pnpm lint` | Lint con ESLint |
| `pnpm test` | Tests unitarios (Jest) |

**client/**

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |

## Endpoints del backend

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/user/:username` | Perfil de GitHub (nombre, bio, avatar, repos públicos, seguidores, hireable, email, etc.) |
| `GET` | `/user/:username/repos` | Repos públicos, ordenados por actualización reciente (lenguaje, stars, forks, watchers, license, tamaño) |
| `GET` | `/user/:username/activity` | Actividad pública reciente (push, ramas, issues, PRs, releases) |

Los tres devuelven `404` con mensaje propio si el username no existe, y `429` si se alcanza el rate limit de la API pública de GitHub.

## Deploy

Backend en **Railway**, frontend en **Vercel** (links al principio de este README). Dos variables de entorno hay que setearlas a mano en cada dashboard — no viajan solas desde el `.env.example`:

- **Vercel** → `NEXT_PUBLIC_API_URL` = URL pública del backend, sin path ni barra final. Al ser una var `NEXT_PUBLIC_*`, Next.js la incluye en el build: cambiarla requiere **redeploy** para que tome efecto.
- **Railway** → `CORS_ORIGIN` = URL pública del frontend (no `localhost`), o el navegador bloquea por CORS las búsquedas hechas desde el cliente.

## Próximos pasos

- [x] Endpoint `GET /user/:username` y adicionales (`/repos`, `/activity`).
- [x] UI en Next.js consumiendo el backend propio.
- [x] Deploy de backend (Railway) y frontend (Vercel).
- [ ] Responder el email de entrega con los links.
