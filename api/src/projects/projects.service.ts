import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private async assertMember(userId: string, workspaceId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!m) throw new ForbiddenException('Not a workspace member');
    return m;
  }

  async list(userId: string, workspaceId?: string) {
    return this.prisma.project.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        workspace: { members: { some: { userId } } },
      },
      include: { _count: { select: { tasks: true } }, workspace: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    await this.assertMember(userId, dto.workspaceId);
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: dto.workspaceId,
      },
    });
  }

  async get(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: { members: { some: { userId } } },
      },
      include: {
        labels: true,
        workspace: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.get(userId, projectId);
    return this.prisma.project.update({
      where: { id: project.id },
      data: dto,
    });
  }

  async createLabel(
    userId: string,
    projectId: string,
    data: { name: string; color?: string },
  ) {
    await this.get(userId, projectId);
    return this.prisma.label.create({
      data: {
        projectId,
        name: data.name,
        color: data.color ?? '#1677ff',
      },
    });
  }
}
