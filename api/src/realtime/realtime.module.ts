import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TasksGateway } from './tasks.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'teamflow-dev-secret',
    }),
  ],
  providers: [TasksGateway],
  exports: [TasksGateway],
})
export class RealtimeModule {}
