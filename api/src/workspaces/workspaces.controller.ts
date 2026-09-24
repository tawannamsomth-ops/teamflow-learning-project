import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AddMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
} from './dto/workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspaces: WorkspacesService) {}

  @Get()
  list(@Req() req: { user: { userId: string } }) {
    return this.workspaces.listForUser(req.user.userId);
  }

  @Post()
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaces.create(req.user.userId, dto);
  }

  @Get(':workspaceId')
  get(
    @Req() req: { user: { userId: string } },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaces.get(req.user.userId, workspaceId);
  }

  @Patch(':workspaceId')
  update(
    @Req() req: { user: { userId: string } },
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaces.update(req.user.userId, workspaceId, dto);
  }

  @Delete(':workspaceId')
  remove(
    @Req() req: { user: { userId: string } },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaces.remove(req.user.userId, workspaceId);
  }

  @Post(':workspaceId/members')
  addMember(
    @Req() req: { user: { userId: string } },
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspaces.addMember(req.user.userId, workspaceId, dto);
  }
}
