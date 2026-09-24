import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Loads workspace membership onto request.user.workspaceRole when :workspaceId present. */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId as string | undefined;
    const workspaceId =
      req.params.workspaceId ??
      req.body?.workspaceId ??
      req.query?.workspaceId;
    if (!userId || !workspaceId) return true;

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: String(workspaceId) },
      },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    req.user.workspaceRole = member.role;
    return true;
  }
}
