import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@teamflow.dev' },
    update: {},
    create: {
      email: 'alice@teamflow.dev',
      name: 'Alice Chen',
      passwordHash,
    },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@teamflow.dev' },
    update: {},
    create: {
      email: 'bob@teamflow.dev',
      name: 'Bob Rivera',
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Product',
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'TeamFlow Launch',
      description: 'Ship the MVP board experience',
      workspaceId: workspace.id,
      labels: {
        create: [
          { name: 'frontend', color: '#0ea5e9' },
          { name: 'backend', color: '#22c55e' },
          { name: 'bug', color: '#ef4444' },
        ],
      },
    },
    include: { labels: true },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Design Kanban columns',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: alice.id,
        position: 0,
      },
      {
        title: 'Wire NestJS task API',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: bob.id,
        position: 0,
      },
      {
        title: 'Add Redis rate limiting',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: bob.id,
        position: 0,
      },
      {
        title: 'Playwright smoke tests',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.MEDIUM,
        projectId: project.id,
        creatorId: alice.id,
        position: 0,
      },
    ],
  });

  console.log('Seeded alice@teamflow.dev / password123');
  console.log('Workspace:', workspace.id, 'Project:', project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
