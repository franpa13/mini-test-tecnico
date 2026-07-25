# mini-test-tecnico

Mini-reto técnico para el proceso de selección de **Nacer Digital**: una aplicación fullstack que muestra la información de un perfil de GitHub.

- **Backend:** [NestJS](https://nestjs.com/) — expone un endpoint que consulta la API pública de GitHub.
- **Frontend:** [Next.js](https://nextjs.org/) — consume ese endpoint y renderiza los datos del perfil.

> Estado actual: proyecto recién scaffoldeado (`nest new` + `create-next-app`), sin lógica de negocio implementada todavía. Este README es solo de referencia/instalación; el desarrollo del reto se aborda después.

## Requisitos del reto

1. **Backend (NestJS):** endpoint `GET /user/:username` que consulte la API pública de GitHub (`https://api.github.com/users/:username`) y devuelva nombre, bio, cantidad de repos públicos, seguidores, etc.
2. **Frontend (Next.js):** interfaz que al cargar muestre esos datos, consumiendo específicamente el endpoint propio del backend (no la API de GitHub directamente).
3. **Deploy:** backend y frontend desplegados (herramienta libre).
4. **Entrega:** responder el email con el link al repo (público) y el link del deploy del frontend, dentro de las 48 hs.

## Estructura del proyecto

```
mini-test-tecnico/
├── client/     # Next.js (App Router) + Tailwind CSS
└── server/     # NestJS
```

## Stack y versiones

| Paquete | Client (Next.js) | Server (NestJS) |
|---|---|---|
| Framework | Next.js 16.2.11 | NestJS 11 |
| Runtime | React 19.2.4 | Node.js (Express bajo NestJS) |
| Estilos | Tailwind CSS 4 | — |
| Lenguaje | TypeScript 5 | TypeScript 5 |
| Gestor de paquetes | pnpm | pnpm |

> ⚠️ **Nota:** `client` usa una versión de Next.js (16) que puede introducir cambios respecto a versiones anteriores. Si algo de la API de Next no se comporta como se espera, revisar `client/node_modules/next/dist/docs/` antes de asumir el comportamiento clásico (ver `client/AGENTS.md`).

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
| `CORS_ORIGIN` | `http://localhost:4001` | Origen permitido por CORS (la URL del frontend). |
| `GITHUB_API_URL` | `https://api.github.com` | Base URL de la API pública de GitHub. |
| `GITHUB_TOKEN` | *(vacío)* | Opcional. Personal Access Token de GitHub (classic, sin scopes) para subir el rate limit de 60 a 5000 req/hora. Generar en [github.com/settings/tokens](https://github.com/settings/tokens). No es obligatorio para el reto. |

**client/.env.local**

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4001` | Referencia del puerto del frontend. El puerto real lo fija `-p 4001` en el script `dev` de `package.json` (Next.js no lee el puerto desde archivos `.env`, solo desde una env var real del SO) — si se cambia acá, hay que cambiarlo también ahí. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL base del backend. Debe apuntar al server local en desarrollo y a la URL de deploy del backend en producción. |

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

## Deploy

- **Backend:** Railway. URL: `https://mini-test-tecnico-production.up.railway.app`.
- **Frontend:** Vercel. URL: `https://mini-test-tecnico.vercel.app`.

Al desplegar, ojo con dos variables de entorno que **no** viajan solas desde el `.env.example` — hay que setearlas a mano en el dashboard de cada plataforma:

- **En Vercel** (Settings → Environment Variables): `NEXT_PUBLIC_API_URL` = la URL pública del backend (Railway). Como es una var `NEXT_PUBLIC_*`, Next.js la incluye en el build — si se agrega o cambia, hay que **redeployar** para que tome efecto (no alcanza con guardarla).
- **En Railway** (Variables): `CORS_ORIGIN` = la URL pública del frontend (Vercel), no `http://localhost:4001`. Si queda apuntando a localhost, el navegador bloquea por CORS las búsquedas que se hacen client-side (no la carga inicial, que es server-to-server y no pasa por CORS).

Si alguna de las dos queda mal configurada, la home tira `Uncaught Error: An error occurred in the Server Components render` en producción (Next.js oculta el mensaje real). `app/page.tsx` tiene un try/catch alrededor del fetch inicial que muestra un `ErrorState` prolijo en vez de romper la página — pero la causa de fondo sigue siendo la variable mal seteada, no la falta de manejo de errores.

## Próximos pasos

- [x] Implementar `GET /user/:username` en `server` (llamada a la API pública de GitHub).
- [x] Implementar `GET /user/:username/repos` como endpoint adicional.
- [x] Implementar la UI en `client` que consuma esos endpoints.
- [x] Desplegar backend (Railway) y frontend (Vercel).
- [ ] Responder el email con los links de repo y deploy.
- [ ] Responder el email con los links de repo y deploy.
