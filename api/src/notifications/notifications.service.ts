import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async notify(userId: string, title: string, body: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, body },
    });
    try {
      await this.redis.publish(
        `notifications:${userId}`,
        JSON.stringify(notification),
      );
      await this.redis.set(
        `notif:latest:${userId}`,
        JSON.stringify(notification),
        3600,
      );
    } catch {
      /* Redis optional for delivery fan-out */
    }
    return notification;
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
