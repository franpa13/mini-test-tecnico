# CLAUDE.md

Contexto de proyecto para Claude Code. Ver también [README.md](README.md) para instalación/ejecución.

## Qué es esto

Mini-reto técnico del proceso de selección de **Nacer Digital**. Es una prueba de evaluación, no un producto real — el objetivo es demostrar capacidad de armar un fullstack simple y correcto en poco tiempo (20-40 min estimados por el enunciado), no sobre-ingenierizarlo.

## Consigna original (textual)

> Creá una aplicación simple que muestre información de tu propio perfil de GitHub.
>
> **Backend en NestJS:** Creá un endpoint `GET /user/:username` que consulte la API pública de GitHub y devuelva nombre, bio, cantidad de repositorios públicos, cantidad de seguidores, etc, cualquier información que veas disponible que pueda luego renderizarse en el frontend.
>
> **Frontend en NextJS:** Creá una interfaz que al cargar muestre esos datos que recopilaste de tu perfil, usando el endpoint que creaste (es necesario que uses específicamente el endpoint que creaste).
>
> **Para entregar:** Desplegá el backend y el frontend. Respondé con el link al repo de GitHub (público) y el link del deploy del frontend. Plazo: no más de 48 hs.

## Requisitos duros (no negociables)

1. Backend **debe** ser NestJS. Frontend **debe** ser Next.js.
2. El endpoint es específicamente `GET /user/:username` — la ruta y el verbo importan.
3. El frontend **tiene que** consumir el endpoint propio del backend, **no** llamar directo a `api.github.com`. Esto es explícito en la consigna y es fácil de romper por accidente si se hace fetch directo desde el cliente.
4. El repo de GitHub del proyecto debe quedar público antes de entregar.
5. Hay que desplegar ambas partes (backend y frontend) — no alcanza con que corra local.

## Alcance esperado

Deliberadamente chico. No agregar:
- Autenticación, base de datos, caché, rate limiting, tests exhaustivos, CI/CD elaborado — nada de eso lo pide la consigna.

Sí conviene:
- Manejar el caso de usuario no encontrado (GitHub devuelve 404) con una respuesta prolija en vez de que explote.
- Mostrar la mayor cantidad de campos útiles del perfil que devuelva `https://api.github.com/users/:username` (nombre, bio, avatar, repos públicos, seguidores, following, ubicación, empresa, blog/link, fecha de creación de cuenta, etc.), ya que la consigna dice explícitamente "cualquier información que veas disponible".
- Endpoints adicionales del backend más allá del perfil, siempre bajo el prefijo `/user/:username/...` (ya se agregó `/user/:username/repos`), para exponer más data de GitHub que el frontend pueda renderizar. Ver "Endpoints implementados" abajo.

## Estructura del repo

```
mini-test-tecnico/
├── client/     # Next.js (App Router) + Tailwind CSS 4 + React 19
└── server/     # NestJS 11
```

Son dos proyectos independientes (cada uno con su propio `package.json`/lockfile de pnpm), no un monorepo con workspace compartido.

## Arquitectura: feature-based / modular, en ambos lados

Regla general: **el código se organiza por feature (dominio), no por tipo de archivo.** Nada de carpetas globales tipo `controllers/`, `services/`, `components/`, `hooks/` con todo mezclado adentro. Cada feature/módulo es un ecosistema autocontenido: tiene adentro todo lo que necesita para funcionar (su lógica, sus tipos, sus subcomponentes/providers), y solo expone hacia afuera lo que otros módulos realmente necesitan consumir. Esto aplica igual en `server/` y en `client/`, aunque la implementación concreta difiere porque son frameworks distintos.

Principios de clean code que quiero que sigas al escribir código en este repo:
- **Una responsabilidad por archivo/clase/función.** Un controller no arma la respuesta del dominio ni transforma datos externos: eso es del service/mapper. Un componente de UI no hace fetch: eso es de una capa de servicio/hook.
- **Nombres explícitos**, sin abreviaturas raras. `getUserByUsername`, no `getU`.
- **No dupliques lógica entre módulos.** Si dos features necesitan lo mismo, eso va a `shared/`, no se copia y pega.
- **Los módulos no se acoplan entre sí directamente.** Si un módulo necesita algo de otro, se expone explícitamente (ej: `index.ts` de barrel export) en vez de importar archivos internos de otro módulo con rutas profundas (`import { X } from '../../otro-modulo/internal/helper'` está mal).
- Preferí composición simple y funciones puras donde se pueda, antes que abstracciones/capas extra que no se van a reusar (ver sección "Alcance esperado" más arriba — este es un reto chico, no hay que inventar arquitectura hexagonal completa para un solo endpoint).

### Backend (NestJS) — módulos por feature

```
server/src/
├── modules/
│   └── user/
│       ├── user.module.ts          # arma el módulo, declara controller + providers
│       ├── user.controller.ts      # solo HTTP: rutas, status codes, delega al service
│       ├── user.service.ts         # lógica: mapea RawGithub* -> DTOs propios, traduce errores a HttpException
│       ├── github-api.client.ts    # único punto que le pega a la API de GitHub (fetch + auth header + parseo de error)
│       ├── dto/
│       │   ├── user-profile.dto.ts # forma de GET /user/:username
│       │   └── user-repo.dto.ts    # forma de GET /user/:username/repos
│       └── types/
│           └── github-api.types.ts # tipos de la respuesta CRUDA de GitHub (RawGithubUser, RawGithubRepo)
├── shared/
│   ├── middleware/
│   │   └── logger.middleware.ts        # logging de requests (método, url, status, duración) — aplicado a toda la app
│   ├── interceptors/
│   │   └── response.interceptor.ts     # envuelve toda respuesta 2xx en el envelope { success, statusCode, data, timestamp, path }
│   ├── filters/
│   │   └── http-exception.filter.ts    # envuelve todo error (HttpException o no) en { success, statusCode, message, error, timestamp, path }
│   └── config/
│       └── configuration.ts            # lectura tipada de env vars (PORT, CORS_ORIGIN, GITHUB_API_URL, GITHUB_TOKEN)
├── app.module.ts                       # importa los módulos de features, registra middlewares/interceptor/filter globales (APP_INTERCEPTOR, APP_FILTER)
└── main.ts
```

Cada feature nueva (si alguna vez se agrega otra) vive en `modules/<nombre-feature>/` con esa misma forma: module + controller + service + cliente HTTP propio + dto. El controller nunca llama directo a `fetch`/axios a una API externa: eso pasa siempre por el service, que a su vez usa el `*-api.client.ts` del módulo. `github-api.client.ts` vive **adentro** de `modules/user/` (no en `shared/http/`) porque hoy solo ese módulo consulta GitHub — recién si un segundo módulo necesitara hablarle a una API externa se evalúa subir un cliente HTTP genérico a `shared/`. Los DTOs (`dto/*.dto.ts`) son `interface`, no `class` — nunca se instancian con `new`, el service arma objetos planos, así que una interfaz alcanza y evita el chequeo de inicialización de propiedades que sí aplica a las clases.

### Respuesta HTTP uniforme (envelope)

Todas las respuestas del backend, éxito o error, tienen la misma forma de sobre — esto lo resuelven `shared/interceptors/response.interceptor.ts` y `shared/filters/http-exception.filter.ts`, registrados globalmente en `app.module.ts` como `APP_INTERCEPTOR`/`APP_FILTER` (no en `main.ts`, para que participen del DI de Nest). Los controllers y services no arman este sobre — devuelven el DTO o tiran una `HttpException` común (`NotFoundException`, etc.) y el envelope se aplica solo.

Éxito:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { "...": "el DTO de la respuesta" },
  "timestamp": "2026-07-24T18:11:04.000Z",
  "path": "/user/octocat"
}
```

Error:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "No existe un usuario de GitHub llamado \"x\"",
  "error": "Not Found",
  "timestamp": "2026-07-24T18:11:04.000Z",
  "path": "/user/x"
}
```

Si se agrega un endpoint nuevo, no hay que hacer nada extra para que respete este formato: aplica a toda la app automáticamente.

### Endpoints implementados

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/user/:username` | Perfil (requisito duro #2, ruta exacta). Mapea `GET https://api.github.com/users/:username`. Incluye `hireable` y `email` (suelen venir `null` salvo que el usuario los haga públicos). |
| `GET` | `/user/:username/repos` | Repos públicos, ordenados por actualización reciente. Mapea `GET https://api.github.com/users/:username/repos`. Incluye `license`, `sizeKb`, `watchers`. |
| `GET` | `/user/:username/activity` | Actividad pública reciente (push, creación de ramas, issues, PRs, releases, etc.). Mapea `GET https://api.github.com/users/:username/events/public`. `user.service.ts` traduce cada `RawGithubEvent.type` a una descripción en español (`describeEvent`/`describeAction`/`describeRefType`) — si GitHub agrega un tipo de evento no contemplado, cae al `default` genérico `"Actividad: {type}"`, no rompe. **Ojo:** el payload público de `PushEvent` ya no trae `size`/`commits` (GitHub lo recortó) — solo `ref`, de ahí que la descripción sea "push a la rama X" y no "push de N commits". |

Los tres devuelven `404` con mensaje propio si el username no existe en GitHub, y `429` si se pega el rate limit de la API pública de GitHub (sin `GITHUB_TOKEN`: 60 req/hora; con token: 5000 req/hora).

### Frontend (Next.js, App Router) — features + shared

```
client/src/
├── app/
│   ├── layout.tsx                          # metadata + fuentes, arma el <html>/<body>, monta <Footer/>
│   └── page.tsx                            # Server Component: fetch inicial (perfil de DEFAULT_USERNAME) + monta el feature. `dynamic = 'force-dynamic'` + try/catch con <ErrorState/> si el backend no responde
├── features/
│   └── github-profile/
│       ├── components/
│       │   ├── profile-explorer.tsx        # "use client": orquestador — estado (profile/repos/activity/loading/error), maneja la búsqueda
│       │   ├── profile-search-banner.tsx   # "use client": banner (github.png | input+botón | git.png), en mobile los logos pasan a esquinas chicas en diagonal
│       │   ├── profile-card.tsx            # info del perfil (avatar, bio, stats, hireable, email, ubicación, etc.)
│       │   ├── activity-list.tsx           # "Actividad reciente": título vía <SectionTitle> + acordeón agrupado por repo (oculta si viene vacía)
│       │   ├── activity-item.tsx           # un evento de actividad — ícono por tipo (PushEvent, CreateEvent, etc.) + tiempo relativo
│       │   ├── repo-list.tsx               # "Repositorios": título vía <SectionTitle> + grid de RepoCard
│       │   └── repo-card.tsx               # un repo (lenguaje, stars, forks, watchers, license, tamaño)
│       ├── services/
│       │   ├── get-github-profile.ts       # GET /user/:username vía apiFetch
│       │   ├── get-github-repos.ts         # GET /user/:username/repos vía apiFetch
│       │   └── get-github-activity.ts      # GET /user/:username/activity vía apiFetch
│       ├── types/
│       │   └── github-profile.ts           # GithubProfile / GithubRepo / GithubActivity — matchea los DTOs del backend
│       └── index.ts                        # barrel: hoy expone solo <ProfileExplorer>
└── shared/
    ├── components/
    │   ├── ui/                             # primitivas de shadcn (Card, Button, Input, Accordion) — librería de diseño de base, sin lógica de dominio
    │   ├── section-title.tsx               # título de sección con ícono (prop `icon: LucideIcon`) — lo usan repo-list y activity-list, por eso es shared y no vive en un solo componente
    │   ├── spinner.tsx                     # loading genérico
    │   ├── error-state.tsx                 # error genérico
    │   ├── footer.tsx                      # "Hecho por Francisco Paredes" con link a GitHub — montado en layout.tsx, aparece en toda la app
    │   ├── theme-provider.tsx              # "use client": wrapper de next-themes (ThemeProvider attribute="class"), montado en layout.tsx
    │   └── theme-toggle.tsx                # "use client": botón sol/luna con useTheme(), vive al lado del botón de buscar en profile-search-banner.tsx
    ├── lib/
    │   ├── api.ts                          # apiFetch: base URL desde env + desenvuelve el envelope {success,data,message} del backend
    │   ├── format-relative-time.ts         # "hace 3 horas" (Intl.RelativeTimeFormat) — lo usa activity-item
    │   └── format-file-size.ts             # KB -> "120 KB" / "1.2 MB" — lo usa repo-card
    └── types/
        └── api-error.ts                    # ApiError (statusCode + message), la tira apiFetch cuando success:false
```

`app/` en Next.js son solo rutas: arman la página componiendo lo que exporta el feature. La lógica real (fetch, estado, presentación) vive en `features/<nombre>/`. `shared/components/ui/` (shadcn) es una capa aparte del resto de `shared/components/`: son primitivas de diseño genéricas (botón, input, card, accordion) sin lógica de dominio, instaladas con `pnpm dlx shadcn@latest add <componente>` — el resto de `shared/components/` son piezas nuestras (spinner, estado de error, section-title) que sí conocen el dominio o al menos componen esas primitivas. `components.json` tiene el alias `"ui": "@/shared/components/ui"` (no el default `@/components/ui`) — así cualquier componente nuevo que se instale con el CLI cae en el lugar correcto sin tener que moverlo a mano.

### Qué va en `shared/` (y qué NO)

`shared/` es exclusivamente para lo que **más de un módulo/feature usa tal cual, sin conocer detalles del dominio de otros**. Ejemplos legítimos: el wrapper de fetch con la base URL, un componente de loading/error genérico, un tipo de error genérico, helpers de formateo (fechas, números). Si algo solo lo usa un feature, se queda adentro de ese feature — no se sube "por las dudas" a `shared/`. Regla práctica: si al escribir el código dudás si algo es shared, probablemente no lo es todavía; lo subís a `shared/` recién cuando un segundo módulo lo necesita.

### Cómo funciona la búsqueda (interacción, no ruta nueva)

`page.tsx` hace el fetch inicial en el servidor para `DEFAULT_USERNAME` (hoy `"franpa13"`, hardcodeado ahí mismo) y se lo pasa como `initialProfile`/`initialRepos` a `<ProfileExplorer>`. Ese componente pinta el banner arriba (fijo) y el resultado debajo; al buscar otro username en el input del banner, refetchea `getGithubProfile`/`getGithubRepos` client-side y reemplaza el resultado **sin cambiar de URL ni recargar la página** (esto se decidió así por simplicidad — no hay ruta dinámica `/[username]`, todo vive en `/`).

### Ejemplo: cómo el frontend consume el endpoint propio (no llama a GitHub directo)

`client/src/shared/lib/api.ts` — wrapper base, desenvuelve el envelope del backend:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const body = await res.json(); // { success, statusCode, data?, message? }
  if (!res.ok || !body.success) {
    throw new ApiError(body.message ?? 'Error consultando la API', body.statusCode ?? res.status);
  }
  return body.data as T;
}
```

`client/src/features/github-profile/services/get-github-profile.ts` — el feature usa el wrapper, nunca `fetch` directo a `api.github.com`:

```ts
import { apiFetch } from '@/shared/lib/api';
import type { GithubProfile } from '../types/github-profile';

export function getGithubProfile(username: string) {
  return apiFetch<GithubProfile>(`/user/${username}`);
}
```

Ojo con el requisito duro #3: `get-github-profile.ts` le pega a **nuestro** backend (`NEXT_PUBLIC_API_URL` + `/user/:username`), no a `api.github.com`. Esa es la línea que no hay que cruzar por accidente.

### Cómo te voy a pedir features de acá en adelante

Cuando te pida agregar algo, esperá que te diga a qué feature/módulo pertenece (o si es nuevo). Si no te lo digo explícitamente, preguntame en vez de asumir dónde va, sobre todo la duda de "esto es shared o es de este feature". Si un pedido implica tocar código en `server/` y `client/` a la vez, tratalos como dos tareas relacionadas pero independientes (cada uno con su propio DTO/tipo, que deben coincidir en forma).

## Stack y decisiones técnicas ya tomadas

- **Gestor de paquetes:** pnpm en ambos proyectos.
- **Backend:** NestJS 11, TypeScript **pinned en 5.9.3** (no "latest"). `@typescript-eslint`/`typescript-eslint` requieren `typescript <6.1.0` y `ts-jest` requiere `<7`, así que no actualizar TypeScript sin chequear esos peer deps primero — ya pasamos por instalar TS 7 "latest" y rompió el build (`baseUrl` removido) y el lint. `server/tsconfig.json` tiene `"ignoreDeprecations": "5.0"`, que es el único valor literal que TS 5.9.3 acepta para esa opción (no `"6.0"`, aunque el propio mensaje de error de VS Code sugiera eso — es una rareza conocida de esa versión de TS, ver commit history si hace falta). Si el editor marca error ahí pero `npx tsc --noEmit` compila limpio, es el TS Server de VS Code con versión vieja cacheada: reiniciarlo con "TypeScript: Restart TS Server".
- **Config del backend:** `@nestjs/config` con `ConfigModule.forRoot({ isGlobal: true })`, cargando `server/src/shared/config/configuration.ts` (tipado, interfaz `AppConfig`). `main.ts` lee `port` y `corsOrigin` del `ConfigService` en vez de `process.env` directo — cualquier env var nueva se agrega ahí, no accediendo a `process.env` suelto en otros archivos.
- **Frontend:** Next.js 16.2.11 (versión nueva con posibles cambios de API respecto a lo que Claude conoce por training — ver `client/AGENTS.md`, que indica revisar `client/node_modules/next/dist/docs/` antes de asumir comportamiento de versiones anteriores).
- **UI:** Tailwind CSS 4 + shadcn (`components.json`, estilo `base-nova`, primitivas sobre `@base-ui/react`) + `lucide-react` para íconos. Componentes de shadcn se agregan con `pnpm dlx shadcn@latest add <componente>` — caen en `src/shared/components/ui/` porque `components.json` tiene `"ui": "@/shared/components/ui"` (se cambió del default `@/components/ui` a propósito, verificado instalando un componente de prueba). `utils` (el `cn` helper) sigue apuntando al default `@/lib/utils` → `src/lib/utils.ts`, eso no se movió. Ojo que esa CLI en este proyecto en algún momento creó `lib/utils.ts` en la raíz de `client/` en vez de `client/src/lib/utils.ts` (el que realmente resuelve el alias, porque `@/*` apunta a `./src/*`) — si vuelve a pasar, borrar el de la raíz, es código muerto.
- **Dark mode:** `next-themes`, wireado en `app/layout.tsx` (`<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`, envolviendo `{children}` + `<Footer/>`). Requiere `suppressHydrationWarning` en el `<html>` (next-themes inyecta la clase `dark` antes de hidratar, así que un mismatch ahí es esperado y no un bug). `globals.css` ya traía las variables `.dark` de shadcn — no hubo que tocar CSS, solo activar el mecanismo. El toggle (`shared/components/theme-toggle.tsx`) usa `useTheme()` y no renderiza el ícono correcto hasta después del `useEffect` de montaje (mismo motivo: el tema real solo se sabe en el cliente).
- **Imágenes remotas:** `next.config.ts` tiene `images.remotePatterns` con `avatars.githubusercontent.com` — cualquier otro host de imagen remota que se use con `next/image` hay que agregarlo ahí o Next tira error en runtime.
- **Puertos:** backend `:4000`, frontend `:4001` (no `3000`/`3001`: en esta máquina, Windows con Docker Desktop + WSL2, el proxy de Docker acapara ese rango). Ver `.env.example` en cada carpeta. El puerto del frontend se fija con `-p 4001` en el script `dev` de `client/package.json` porque Next.js **no** lee el puerto desde `.env.local`, solo desde una env var real del SO — si se cambia el puerto, hay que tocar ambos lugares.
- **CORS:** habilitado en el backend (`app.enableCors`) restringido a `CORS_ORIGIN` (la URL del frontend), no abierto a cualquier origen.
- **Variables de entorno:** cada proyecto tiene `.env.example` (commiteado) y su `.env`/`.env.local` real (gitignorado). Ver tabla completa en el README, sección "Variables de entorno". `GITHUB_TOKEN` es opcional (sube el rate limit de la API de GitHub de 60 a 5000 req/hora) — no hace falta para que el reto funcione.

## Estado actual (a mantener actualizado)

Backend y frontend completos e implementados (ver "Endpoints implementados" y la sección de arquitectura frontend arriba), **desplegados**: backend en Railway, frontend en Vercel (URLs en el README, sección "Deploy"). `app/page.tsx` fuerza `dynamic = 'force-dynamic'` (los datos son en vivo, no tiene sentido cachearlos en build time) y tiene try/catch alrededor del fetch inicial para no romper toda la página si el backend no responde. Falta: responder el email de entrega con los links.

## Cómo trabajar en este repo

- Priorizar simplicidad sobre "hacerlo bien" en el sentido de una app de producción — es una prueba con plazo de 48 hs.
- Antes de dar por completo el reto, verificar los 5 requisitos duros de la sección anterior uno por uno.
