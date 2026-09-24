import {
  Body,
  Controller,
  Delete,
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
  CreateCommentDto,
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  list(@Req() req: { user: { userId: string } }, @Query() query: TaskQueryDto) {
    return this.tasks.list(req.user.userId, query);
  }

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user.userId, dto);
  }

  @Get(':taskId')
  get(
    @Req() req: { user: { userId: string } },
    @Param('taskId') taskId: string,
  ) {
    return this.tasks.get(req.user.userId, taskId);
  }

  @Patch(':taskId')
  update(
    @Req() req: { user: { userId: string } },
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(req.user.userId, taskId, dto);
  }

  @Delete(':taskId')
  remove(
    @Req() req: { user: { userId: string } },
    @Param('taskId') taskId: string,
  ) {
    return this.tasks.remove(req.user.userId, taskId);
  }

  @Post(':taskId/comments')
  comment(
    @Req() req: { user: { userId: string } },
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasks.addComment(req.user.userId, taskId, dto);
  }
}
