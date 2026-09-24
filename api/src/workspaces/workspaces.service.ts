import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto, CreateWorkspaceDto } from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        members: { create: { userId, role: Role.OWNER } },
      },
      include: { members: true },
    });
  }

  async get(userId: string, workspaceId: string) {
    const ws = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        projects: true,
      },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async addMember(actorId: string, workspaceId: string, dto: AddMemberDto) {
    const actor = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: actorId, workspaceId } },
    });
    if (!actor || (actor.role !== Role.OWNER && actor.role !== Role.ADMIN)) {
      throw new ForbiddenException('Only owners/admins can add members');
    }
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
      create: {
        userId: user.id,
        workspaceId,
        role: dto.role ?? Role.MEMBER,
      },
      update: { role: dto.role ?? Role.MEMBER },
    });
  }
}
