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
    client.join(`group:${data.groupId}`);
    this.logger.log(`Client ${client.id} joined group:${data.groupId}`);
    return { event: 'chat:joined', groupId: data.groupId };
  }

  @SubscribeMessage('chat:send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; senderId: string; senderName: string; content: string },
  ) {
    const payload = {
      id: Date.now().toString(),
      groupId: data.groupId,
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      sentAt: new Date().toISOString(),
    };
    this.server.to(`group:${data.groupId}`).emit('chat:receive-message', payload);
    return payload;
  }
}
