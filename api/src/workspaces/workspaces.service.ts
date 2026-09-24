import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  private async requireMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    return member;
  }

  private async requireOwnerOrAdmin(userId: string, workspaceId: string) {
    const member = await this.requireMember(userId, workspaceId);
    if (member.role !== Role.OWNER && member.role !== Role.ADMIN) {
      throw new ForbiddenException('Only owners/admins can do this');
    }
    return member;
  }

  listForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
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

  async update(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    await this.requireOwnerOrAdmin(userId, workspaceId);
    await this.get(userId, workspaceId);
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: dto.name },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { projects: true } },
      },
    });
  }

  async remove(userId: string, workspaceId: string) {
    const member = await this.requireMember(userId, workspaceId);
    if (member.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete a workspace');
    }
    await this.get(userId, workspaceId);
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
    return { ok: true };
  }

  async addMember(actorId: string, workspaceId: string, dto: AddMemberDto) {
    await this.requireOwnerOrAdmin(actorId, workspaceId);
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
