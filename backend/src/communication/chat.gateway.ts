import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat:join-group')
  handleJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    if (data?.groupId) {
      client.join(`group:${data.groupId}`);
      this.logger.log(`Client ${client.id} joined group:${data.groupId}`);
      return { event: 'chat:joined', groupId: data.groupId };
    }
  }

  @SubscribeMessage('chat:leave-group')
  handleLeaveGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    if (data?.groupId) {
      client.leave(`group:${data.groupId}`);
      this.logger.log(`Client ${client.id} left group:${data.groupId}`);
      return { event: 'chat:left', groupId: data.groupId };
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; userName: string; isTyping: boolean },
  ) {
    if (data?.groupId) {
      client.to(`group:${data.groupId}`).emit('chat:user-typing', {
        groupId: data.groupId,
        userName: data.userName,
        isTyping: data.isTyping,
      });
    }
  }
}
