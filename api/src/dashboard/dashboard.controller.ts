import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get('stats')
  async stats(
    @Req() req: { user: { userId: string } },
    @Query('workspaceId') workspaceId?: string,
  ) {
    const userId = req.user.userId;
    const cacheKey = `stats:${userId}:${workspaceId ?? 'all'}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as {
          projects: number;
          tasksByStatus: Record<string, number>;
          overdue: number;
          assignedToMe: number;
        };
      }
    } catch {
      /* ignore */
    }

    const projectFilter = {
      workspace: {
        members: { some: { userId } },
        ...(workspaceId ? { id: workspaceId } : {}),
      },
    };

    const [projects, tasksByStatus, overdue, assignedToMe] = await Promise.all([
      this.prisma.project.count({ where: projectFilter }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { project: projectFilter },
        _count: true,
      }),
      this.prisma.task.count({
        where: {
          project: projectFilter,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
      this.prisma.task.count({
        where: { assigneeId: userId, project: projectFilter },
      }),
    ]);

    const result = {
      projects,
      tasksByStatus: Object.fromEntries(
        tasksByStatus.map((r) => [r.status, r._count]),
      ),
      overdue,
      assignedToMe,
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 60);
    } catch {
      /* ignore */
    }
    return result;
  }
}
