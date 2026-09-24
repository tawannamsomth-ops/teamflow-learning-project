import { Global, Module, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule implements OnModuleInit {
  constructor(private readonly redis: RedisService) {}

  async onModuleInit() {
    try {
      await this.redis.connect();
    } catch {
      // Redis optional at boot; features degrade gracefully in services
    }
  }
}
