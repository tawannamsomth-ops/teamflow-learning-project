import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksGateway } from '../realtime/tasks.gateway';
import {
  CreateCommentDto,
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  labels: { include: { label: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
    private gateway: TasksGateway,
  ) {}

  private async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: { members: { some: { userId } } },
      },
    });
    if (!project) throw new ForbiddenException('No access to project');
    return project;
  }

  async list(userId: string, query: TaskQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const where: Prisma.TaskWhereInput = {
      project: { workspace: { members: { some: { userId } } } },
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
            ],
          }
        : {}),
    };

    const cacheKey =
      query.projectId && !query.search
        ? `tasks:${query.projectId}:${query.status ?? 'all'}:${page}:${pageSize}`
        : null;

    if (cacheKey) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {
        /* ignore cache miss/errors */
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    const result = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    if (cacheKey) {
      try {
        await this.redis.set(cacheKey, JSON.stringify(result), 30);
      } catch {
        /* ignore */
      }
    }
    return result;
  }

  async create(userId: string, dto: CreateTaskDto) {
    await this.assertProjectAccess(userId, dto.projectId);
    const maxPos = await this.prisma.task.aggregate({
      where: {
        projectId: dto.projectId,
        status: dto.status ?? TaskStatus.TODO,
      },
      _max: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        creatorId: userId,
        position: (maxPos._max.position ?? -1) + 1,
        labels: dto.labelIds?.length
          ? {
              create: dto.labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
      include: taskInclude,
    });

    await this.invalidateProjectCache(dto.projectId);
    this.gateway.emitTaskEvent(dto.projectId, 'task.created', task);

    if (dto.assigneeId && dto.assigneeId !== userId) {
      await this.notifications.notify(
        dto.assigneeId,
        'Task assigned',
        `You were assigned "${task.title}"`,
      );
    }
    return task;
  }

  async get(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { workspace: { members: { some: { userId } } } },
      },
      include: taskInclude,
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existing = await this.get(userId, taskId);
    const { labelIds, dueDate, ...rest } = dto;

    const task = await this.prisma.$transaction(async (tx) => {
      if (labelIds) {
        await tx.taskLabel.deleteMany({ where: { taskId } });
        if (labelIds.length) {
          await tx.taskLabel.createMany({
            data: labelIds.map((labelId) => ({ taskId, labelId })),
          });
        }
      }
      return tx.task.update({
        where: { id: taskId },
        data: {
          ...rest,
          ...(dueDate !== undefined
            ? { dueDate: dueDate ? new Date(dueDate) : null }
            : {}),
        },
        include: taskInclude,
      });
    });

    await this.invalidateProjectCache(existing.projectId);
    this.gateway.emitTaskEvent(existing.projectId, 'task.updated', task);

    if (
      dto.assigneeId &&
      dto.assigneeId !== existing.assigneeId &&
      dto.assigneeId !== userId
    ) {
      await this.notifications.notify(
        dto.assigneeId,
        'Task assigned',
        `You were assigned "${task.title}"`,
      );
    }
    return task;
  }

  async remove(userId: string, taskId: string) {
    const existing = await this.get(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    await this.invalidateProjectCache(existing.projectId);
    this.gateway.emitTaskEvent(existing.projectId, 'task.deleted', {
      id: taskId,
    });
    return { ok: true };
  }

  async addComment(userId: string, taskId: string, dto: CreateCommentDto) {
    const task = await this.get(userId, taskId);
    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, body: dto.body },
      include: { author: { select: { id: true, name: true } } },
    });
    this.gateway.emitTaskEvent(task.projectId, 'task.comment', {
      taskId,
      comment,
    });
    return comment;
  }

  private async invalidateProjectCache(projectId: string) {
    try {
      const client = this.redis.getClient();
      const keys = await client.keys(`tasks:${projectId}:*`);
      if (keys.length) await client.del(...keys);
    } catch {
      /* ignore */
    }
  }
}
