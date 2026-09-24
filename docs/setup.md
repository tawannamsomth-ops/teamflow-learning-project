# Setup

## Prerequisites

- Node.js 22+
- Docker (MySQL 8 + Redis 7)
- npm

## Environment

Copy `api/.env.example` → `api/.env`:

```
DATABASE_URL=mysql://teamflow:teamflow@localhost:3306/teamflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=teamflow-dev-secret-change-in-prod
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

Web (optional `.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001/realtime
```

## Migrate & seed

```bash
docker compose up -d mysql redis
cd api
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

Seed users: `alice@teamflow.dev` / `bob@teamflow.dev` — password `password123`.

## Run

```bash
# terminal 1
cd api && npm run start:dev

# terminal 2
cd web && npm run dev
```

## Demo video (portfolio)

Record a 2–3 minute walkthrough: register → create project → drag cards → show Swagger + live second browser tab receiving WebSocket updates.
