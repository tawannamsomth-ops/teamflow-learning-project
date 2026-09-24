import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthedRequest } from './auth-request';

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Loads workspace membership onto request.user.workspaceRole when :workspaceId present. */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.userId;
    const bodyWorkspaceId =
      typeof req.body === 'object' && req.body && 'workspaceId' in req.body
        ? (req.body as { workspaceId?: unknown }).workspaceId
        : undefined;
    const workspaceId =
      firstString(req.params.workspaceId) ??
      firstString(bodyWorkspaceId) ??
      firstString(req.query.workspaceId);
    if (!userId || !workspaceId) return true;

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    if (req.user) req.user.workspaceRole = member.role;
    return true;
  }
}
