import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' },
  namespace: '/realtime',
})
export class TasksGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET ?? 'teamflow-dev-secret',
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('project.subscribe')
  subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (!data?.projectId) return { ok: false };
    void client.join(`project:${data.projectId}`);
    return { ok: true };
  }

  emitTaskEvent(projectId: string, event: string, payload: unknown) {
    this.server?.to(`project:${projectId}`).emit(event, payload);
  }
}
