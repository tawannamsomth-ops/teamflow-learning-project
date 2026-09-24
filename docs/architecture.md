# Architecture

TeamFlow uses a **modular monolith** NestJS API and a Next.js App Router frontend.

```mermaid
flowchart LR
  subgraph Client
    Web["Next.js Kanban UI"]
  end

  subgraph API["NestJS modular monolith"]
    Auth[Auth]
    WS[Workspaces]
    Proj[Projects]
    Tasks[Tasks]
    Notif[Notifications]
    Dash[Dashboard]
    RT[Realtime Gateway]
  end

  Web -->|"REST + JWT"| Auth
  Web -->|"REST + JWT"| WS
  Web -->|"REST + JWT"| Proj
  Web -->|"REST + JWT"| Tasks
  Web -->|"REST + JWT"| Notif
  Web -->|"REST + JWT"| Dash
  Web <-->|"Socket.IO"| RT

  Tasks --> RT
  Tasks --> Notif

  MySQL[(MySQL / Prisma)]
  Redis[(Redis<br/>cache · rate limit · pub)]

  Auth --> MySQL
  WS --> MySQL
  Proj --> MySQL
  Tasks --> MySQL
  Notif --> MySQL
  Dash --> MySQL
  Tasks -.-> Redis
  Notif -.-> Redis
  Dash -.-> Redis
  API -.->|"rate limit"| Redis
```

## Modules (API)

| Module | Responsibility |
| --- | --- |
| `auth` | Register/login, JWT |
| `users` | Current user profile |
| `workspaces` | Multi-tenant containers + RBAC membership |
| `projects` | Boards owned by a workspace |
| `tasks` | Kanban cards, comments, filters, pagination |
| `notifications` | Persist + Redis publish |
| `dashboard` | Aggregated stats (Redis-cached) |
| `realtime` | Socket.IO gateway for live board updates |
| `redis` | Shared ioredis client |
| `prisma` | DB access |

## Permission model

Workspace membership roles: `OWNER`, `ADMIN`, `MEMBER`. Access to projects/tasks is gated by membership on the parent workspace.

```mermaid
flowchart TD
  User --> Member[WorkspaceMember]
  Member -->|"role: OWNER / ADMIN / MEMBER"| Workspace
  Workspace --> Project
  Project --> Task
  Member -.->|"membership required"| Project
  Member -.->|"membership required"| Task
```

## Real-time path

```mermaid
sequenceDiagram
  participant Web as Next.js
  participant API as NestJS REST
  participant GW as Socket.IO Gateway
  participant Room as project:id room

  Web->>API: POST /auth/login → JWT
  Web->>GW: connect(auth.token)
  GW-->>Web: connected
  Web->>GW: project.subscribe { projectId }
  GW->>Room: join
  Web->>API: PATCH /tasks/:id
  API->>Room: emit task.updated
  Room-->>Web: task.updated
```

## Why modular monolith

Fits a small team portfolio: clear module boundaries without distributed-system overhead. Modules can later extract to services if load demands it.
