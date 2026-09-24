import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@Req() req: { user: { userId: string } }) {
    return this.notifications.list(req.user.userId);
  }

  @Patch(':id/read')
  markRead(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(req.user.userId, id);
  }
}
