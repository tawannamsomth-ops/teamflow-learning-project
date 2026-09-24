import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateLabelDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get()
  list(
    @Req() req: { user: { userId: string } },
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.projects.list(req.user.userId, workspaceId);
  }

  @Post()
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(req.user.userId, dto);
  }

  @Get(':projectId')
  get(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
  ) {
    return this.projects.get(req.user.userId, projectId);
  }

  @Patch(':projectId')
  update(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(req.user.userId, projectId, dto);
  }

  @Post(':projectId/labels')
  createLabel(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.projects.createLabel(req.user.userId, projectId, dto);
  }
}
