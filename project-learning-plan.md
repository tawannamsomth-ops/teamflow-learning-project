# TeamFlow: Full-Stack Project-Based Learning Plan

## Project

Build **TeamFlow**, a real-time project management platform for small teams.

It directly matches the skills required for the Full Stack Developer role:

- Node.js and TypeScript
- React and Next.js
- NestJS and Prisma
- MySQL and Redis
- REST API and WebSocket
- Git and Docker
- System architecture and teamwork

## Recommended stack

- **Frontend:** Next.js, React, TypeScript, and Tailwind CSS
- **Backend:** NestJS, REST API, and WebSocket
- **Database:** MySQL with Prisma
- **Performance:** Redis for caching, sessions, notifications, or rate limiting
- **DevOps:** Docker Compose and GitHub Actions
- **Testing:** Jest and Playwright

## Core features

1. User registration, login, and role-based permissions
2. Workspaces and projects
3. Kanban boards with draggable tasks
4. Task assignment, priorities, deadlines, labels, and comments
5. Real-time task updates using WebSocket
6. Notifications stored and delivered through Redis
7. Search, filtering, pagination, and dashboard statistics
8. API documentation with Swagger
9. Unit, integration, and end-to-end tests
10. Dockerized local setup and deployed demo

## Build it in stages

### Stage 1: Foundation

- Set up the repository and TypeScript projects
- Create the MySQL schema with Prisma
- Build authentication, users, projects, and tasks

### Stage 2: Frontend

- Build the Next.js dashboard
- Add the Kanban board
- Connect the frontend to the REST API

### Stage 3: Backend quality

- Add DTO validation and error handling
- Implement pagination, filtering, and permissions
- Document the API with Swagger

### Stage 4: Real-time features

- Add WebSocket task updates
- Use Redis for notifications, caching, or rate limiting

### Stage 5: Delivery

- Add unit, integration, and end-to-end tests
- Create Docker Compose configuration
- Add a CI pipeline
- Deploy a working demo
- Write setup and architecture documentation

## Architecture recommendation

Use a **modular monolith** architecture in NestJS. It is realistic for a small team and demonstrates good system design without unnecessary complexity.

## Portfolio deliverables

- Live demo
- GitHub repository
- Architecture diagram
- Database ER diagram
- API documentation
- Setup instructions
- Short video walkthrough
- Explanation of important technical decisions

This single project demonstrates Node.js/TypeScript, React/Next.js, NestJS, Prisma, MySQL, Redis, REST, WebSocket, Git, Docker, architecture, and complete development ownership.
