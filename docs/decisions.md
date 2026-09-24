# Technical decisions

1. **Modular monolith (NestJS)** — Clear domains without microservice ops cost; realistic for a small product team.
2. **Prisma + MySQL** — Typed schema, migrations, and an ER model employers recognize.
3. **Redis for three jobs** — Task list/stats cache, IP rate limiting, notification pub channel. Keeps Redis purposeful, not decorative.
4. **Socket.IO rooms per project** — Simple fan-out for Kanban; JWT on handshake mirrors REST auth.
5. **Ant Design UI** — Admin-speed forms, layout, cards, stats, and board columns so product screens ship without a custom design system.
6. **Swagger from DTOs** — class-validator + `@nestjs/swagger` keeps docs close to the contract.
7. **Docker Compose** — One command for MySQL/Redis (+ optional full stack build) matches the delivery stage of the learning plan.
8. **CI split api/web** — Fast feedback on unit tests and builds; Playwright stays runnable locally against Compose.
