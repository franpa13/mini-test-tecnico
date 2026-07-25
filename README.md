# mini-test-tecnico

Mini-reto técnico para el proceso de selección de **Nacer Digital**: una aplicación fullstack que muestra información de un perfil de GitHub, consumida a través de un backend propio.

## 🔗 Demo

- **Frontend (en vivo):** https://mini-test-tecnico.vercel.app
- **Backend (API):** https://mini-test-tecnico-production.up.railway.app
- **Repo:** https://github.com/franpa13/mini-test-tecnico

## Consigna y cómo se resolvió cada punto

| Requisito | Cómo se cumplió |
|---|---|
| Backend en **NestJS** con `GET /user/:username` que consulte la API pública de GitHub | Implementado en `server/src/modules/user/`. Mapea `GET https://api.github.com/users/:username` y devuelve nombre, bio, avatar, ubicación, empresa, blog, email, `hireable`, repos públicos, gists, seguidores, siguiendo, fechas — "cualquier información disponible", tal como pide la consigna |
| Frontend en **Next.js** que muestre esos datos al cargar, usando el endpoint propio | `app/page.tsx` (Server Component) llama a `getGithubProfile()` en el servidor y renderiza el resultado — nunca se le pega a `api.github.com` desde el cliente, siempre a través del backend propio (`NEXT_PUBLIC_API_URL`) |
| Desplegar backend y frontend | Backend en **Railway**, frontend en **Vercel** (links arriba) |
| Repo público | ✅ |

Además de lo mínimo pedido, se sumaron dos endpoints más (`/repos` y `/activity`) y una interfaz para buscar el perfil de **cualquier** usuario de GitHub, no solo el propio — ver detalle más abajo.

## Stack y cómo se usó cada pieza

### Backend — NestJS 11 + TypeScript

| Tecnología | Uso concreto en este proyecto |
|---|---|
| **NestJS** (Controllers, Services, Modules) | Arquitectura modular: `modules/user/` agrupa controller, service, cliente HTTP y DTOs de esta feature. El controller solo define rutas y delega; el service traduce datos crudos de GitHub a DTOs propios y errores a `HttpException` |
| **`@nestjs/config`** | Lectura tipada de variables de entorno (`PORT`, `CORS_ORIGIN`, `GITHUB_API_URL`, `GITHUB_TOKEN`) vía `ConfigService`, en vez de `process.env` disperso por el código |
| **Interceptors** (`APP_INTERCEPTOR`) | `ResponseInterceptor` envuelve toda respuesta exitosa en un formato uniforme: `{ success, statusCode, data, timestamp, path }` |
| **Exception Filters** (`APP_FILTER`) | `HttpExceptionFilter` hace lo mismo para errores: `{ success, statusCode, message, error, timestamp, path }`, sea un 404 de usuario inexistente, un 429 de rate limit de GitHub, o cualquier excepción no manejada |
| **Middleware** | `LoggerMiddleware` loguea método, ruta, status code y duración de cada request |
| **`fetch` nativo (Node 22)** | El cliente HTTP hacia la API de GitHub (`github-api.client.ts`) usa `fetch` global, sin dependencias extra tipo axios |

### Frontend — Next.js 16 (App Router) + React 19

| Tecnología / feature de Next.js | Uso concreto en este proyecto |
|---|---|
| **Server Components + `async`/`await` en el render** | `app/page.tsx` es un Server Component `async` que llama a los tres servicios (`getGithubProfile`, `getGithubRepos`, `getGithubActivity`) directamente en el servidor con `Promise.all`, sin `useEffect` ni loading spinner en la carga inicial — el HTML ya llega con los datos |
| **`export const dynamic = 'force-dynamic'`** | Fuerza que la página se renderice en cada request (no en build time). Sin esto, Next intenta pre-renderizarla como estática al hacer `next build`, lo que rompe el build si el backend no está levantado en ese momento, y además dejaría "congelado" el perfil de GitHub con los datos del momento del build en vez de datos en vivo |
| **Client Components (`"use client"`)** | Solo donde hace falta interactividad real: el input de búsqueda (`profile-search-banner.tsx`) y el estado que orquesta la búsqueda (`profile-explorer.tsx`, `activity-list.tsx` por el acordeón con estado "ver más"). El resto de los componentes son Server Components por default |
| **`next/image` con `images.remotePatterns`** | Los avatares de GitHub (`avatars.githubusercontent.com`) se sirven optimizados; hubo que whitelistear ese host en `next.config.ts`, Next.js bloquea imágenes remotas no declaradas |
| **`next/font` (Geist)** | Carga de fuentes optimizada sin flash de fuente sin estilos, vía `next/font/google` en `layout.tsx` |
| **Variables de entorno `NEXT_PUBLIC_*`** | `NEXT_PUBLIC_API_URL` es la única forma en que el cliente (que corre en el navegador) sabe a qué backend pegarle — se resuelve en build time |
| **App Router (`app/layout.tsx`, `app/page.tsx`)** | Estructura de archivos estándar de Next 16; `layout.tsx` monta fuentes, metadata y un footer fijo, `page.tsx` es la única ruta de la app |

### UI

- **Tailwind CSS 4** para todo el estilado (utility classes, sin CSS custom aparte de las variables de tema).
- **shadcn/ui** sobre **`@base-ui/react`** (no Radix): componentes base (`Button`, `Input`, `Card`, `Accordion`) generados con `pnpm dlx shadcn@latest add <componente>`, viven en `client/src/shared/components/ui/`.
- **lucide-react** para los íconos.

### Gestor de paquetes

**pnpm** en ambos proyectos (`client/` y `server/` son proyectos independientes, cada uno con su propio lockfile).

## Funcionalidad

Más allá de lo mínimo pedido por la consigna (mostrar el propio perfil al cargar), la app permite:

- **Buscar cualquier usuario de GitHub** desde un banner con búsqueda, sin recargar la página (fetch client-side al mismo backend).
- **Perfil**: avatar, nombre, bio, ubicación, empresa, blog, email, disponibilidad laboral (`hireable`), y stats (repos, seguidores, siguiendo, gists).
- **Actividad reciente**: timeline de eventos públicos (push, ramas creadas, issues, PRs, releases) agrupados por repositorio en un acordeón.
- **Repositorios**: grid con lenguaje, stars, forks, watchers, licencia y tamaño.

## Arquitectura

Ambos proyectos siguen una arquitectura **feature-based**: el código se organiza por dominio (`modules/user/` en el backend, `features/github-profile/` en el frontend), no por tipo de archivo. El detalle completo de la arquitectura, convenciones y decisiones técnicas está documentado en [CLAUDE.md](CLAUDE.md).

```
mini-test-tecnico/
├── client/     # Next.js (App Router) + Tailwind CSS 4 + React 19
└── server/     # NestJS 11
```

## Requisitos previos

- Node.js 18+ (recomendado LTS más reciente)
- [pnpm](https://pnpm.io/) instalado globalmente (`npm install -g pnpm`)
- Git

## Instalación

Cliente y servidor son proyectos independientes, cada uno con su propio `package.json` y lockfile de pnpm. Hay que instalar dependencias por separado.

```bash
# Backend
cd server
pnpm install

# Frontend
cd ../client
pnpm install
```

## Variables de entorno

Antes de correr cualquiera de las dos apps hay que copiar el `.env.example` correspondiente. Ninguno de los `.env`/`.env.local` reales se commitea (están en `.gitignore`); los `.env.example` sí, como plantilla.

```bash
# Backend
cd server
cp .env.example .env

# Frontend
cd ../client
cp .env.example .env.local
```

**server/.env**

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto donde escucha el backend. |
| `CORS_ORIGIN` | `http://localhost:4001` | Origen permitido por CORS (la URL del frontend). En producción, la URL de Vercel. |
| `GITHUB_API_URL` | `https://api.github.com` | Base URL de la API pública de GitHub. |
| `GITHUB_TOKEN` | *(vacío)* | Opcional. Personal Access Token de GitHub (classic, sin scopes) para subir el rate limit de 60 a 5000 req/hora. Generar en [github.com/settings/tokens](https://github.com/settings/tokens). No es obligatorio para el reto. |

**client/.env.local**

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4001` | Referencia del puerto del frontend. El puerto real lo fija `-p 4001` en el script `dev` de `package.json` (Next.js no lee el puerto desde archivos `.env`, solo desde una env var real del SO) — si se cambia acá, hay que cambiarlo también ahí. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL base del backend, **sin** path ni barra final (ej: `https://mi-backend.railway.app`, no `.../user/algo` ni `.../` ). En producción, la URL de deploy del backend. |

> Nota sobre puertos: se usan `4000`/`4001` en vez de `3000`/`3001` porque en Windows con Docker Desktop + WSL2 el proxy de Docker suele acaparar el rango 3000-3002. Si en tu máquina ese rango está libre, se puede usar sin problema — son solo defaults.

## Ejecución en desarrollo

Necesitás dos terminales, una para cada app (ambas leen su `.env`/`.env.local`).

**Backend (NestJS)** — `http://localhost:4000`:

```bash
cd server
pnpm start:dev
```

**Frontend (Next.js)** — `http://localhost:4001`:

```bash
cd client
pnpm dev
```

## Scripts disponibles

**server/**

| Script | Descripción |
|---|---|
| `pnpm start` | Levanta la app |
| `pnpm start:dev` | Levanta la app en modo watch |
| `pnpm build` | Compila a `dist/` |
| `pnpm start:prod` | Corre el build compilado |
| `pnpm lint` | Lint con ESLint |
| `pnpm test` | Tests unitarios (Jest) |
| `pnpm test:e2e` | Tests end-to-end |

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
| `GET` | `/user/:username/repos` | Repos públicos del usuario, ordenados por actualización reciente (lenguaje, stars, forks, watchers, license, tamaño) |
| `GET` | `/user/:username/activity` | Actividad pública reciente (push, ramas, issues, PRs, releases) |

Los tres devuelven `404` con mensaje propio si el username no existe, y `429` si se alcanza el rate limit de la API pública de GitHub.

## Deploy

- **Backend:** Railway. URL: `https://mini-test-tecnico-production.up.railway.app`.
- **Frontend:** Vercel. URL: `https://mini-test-tecnico.vercel.app`.

Al desplegar, ojo con dos variables de entorno que **no** viajan solas desde el `.env.example` — hay que setearlas a mano en el dashboard de cada plataforma:

- **En Vercel** (Settings → Environment Variables): `NEXT_PUBLIC_API_URL` = la URL pública del backend (Railway), sin path ni barra final. Como es una var `NEXT_PUBLIC_*`, Next.js la incluye en el build — si se agrega o cambia, hay que **redeployar** para que tome efecto (no alcanza con guardarla).
- **En Railway** (Variables): `CORS_ORIGIN` = la URL pública del frontend (Vercel), no `http://localhost:4001`. Si queda apuntando a localhost, el navegador bloquea por CORS las búsquedas que se hacen client-side (no la carga inicial, que es server-to-server y no pasa por CORS).

Si alguna de las dos queda mal configurada, la home tira `Uncaught Error: An error occurred in the Server Components render` en producción (Next.js oculta el mensaje real). `app/page.tsx` tiene un try/catch alrededor del fetch inicial que muestra un `ErrorState` prolijo en vez de romper la página — pero la causa de fondo sigue siendo la variable mal seteada, no la falta de manejo de errores.

## Próximos pasos

- [x] Implementar `GET /user/:username` en `server` (llamada a la API pública de GitHub).
- [x] Implementar endpoints adicionales (`/repos`, `/activity`).
- [x] Implementar la UI en `client` que consuma esos endpoints.
- [x] Desplegar backend (Railway) y frontend (Vercel).
- [ ] Responder el email con los links de repo y deploy.
