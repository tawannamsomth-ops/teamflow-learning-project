# TeamFlow

Real-time project management for small teams. Learning portfolio app covering NestJS, Next.js, Prisma, MySQL, Redis, WebSockets, Docker, and CI.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15, React, TypeScript, Tailwind, dnd-kit |
| Backend | NestJS modular monolith, REST + Socket.IO |
| Data | MySQL + Prisma |
| Cache / rate limit / pub-sub | Redis |
| Docs | Swagger at `/docs` |
| Tests | Jest (API), Playwright (web) |
| Ops | Docker Compose, GitHub Actions |

## Quick start

```bash
# 1. Infra
docker compose up -d mysql redis

# 2. API
cd api
cp .env.example .env   # already present for local defaults
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev

# 3. Web (new terminal)
cd web
npm install
npm run dev
```

- App: http://localhost:3000  
- API: http://localhost:3001/api  
- Swagger: http://localhost:3001/docs  

**Demo login:** `alice@teamflow.dev` / `password123`

## Full stack with Docker

```bash
docker compose up --build
```

## Tests

```bash
cd api && npm test
cd web && npx playwright install && npx playwright test
```

## Docs

- [Architecture](docs/architecture.md)
- [Database ER](docs/er-diagram.md)
- [Setup](docs/setup.md)
- [Technical decisions](docs/decisions.md)
- Learning plan: [project-learning-plan.md](project-learning-plan.md)

## API overview

- `POST /api/auth/register|login`
- `GET /api/users/me`
- `CRUD-ish /api/workspaces`, `/api/projects`, `/api/tasks`
- `GET /api/dashboard/stats`
- `GET /api/notifications`
- WebSocket namespace `/realtime` — `project.subscribe`, events `task.created|updated|deleted`
