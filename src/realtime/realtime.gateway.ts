import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';

@WebSocketGateway({ path: '/v1/realtime' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Map of username -> active WebSocket connection
  private activeClients = new Map<string, WebSocket>();
  // Reverse map of socket -> username for cleanup
  private socketToUser = new Map<WebSocket, string>();

  handleConnection(client: WebSocket) {
    console.log('[RealtimeGateway] Client connected');
  }

  handleDisconnect(client: WebSocket) {
    const username = this.socketToUser.get(client);
    if (username) {
      this.activeClients.delete(username);
      this.socketToUser.delete(client);
      console.log(`[RealtimeGateway] User ${username} disconnected`);
    }
  }

  @SubscribeMessage('user.register')
  handleUserRegister(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const username = (data?.username || '').trim().toLowerCase();
    if (!username) return;

    this.activeClients.set(username, client);
    this.socketToUser.set(client, username);
    console.log(`[RealtimeGateway] User registered: ${username}`);

    client.send(
      JSON.stringify({
        event: 'user.registered',
        data: { username, status: 'ONLINE', timestamp: Date.now() },
      }),
    );
  }

  @SubscribeMessage('message.send')
  handleMessageSend(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const sender = this.socketToUser.get(client) || data?.sender || 'Anonymous';
    const recipient = (data?.recipient || '').trim().toLowerCase();
    const text = data?.text || '';
    const id = data?.id || `msg_${Date.now()}`;

    console.log(`[RealtimeGateway] Message from ${sender} to ${recipient}: ${text}`);

    // If recipient is connected, forward the message in realtime
    const recipientSocket = this.activeClients.get(recipient);
    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
      recipientSocket.send(
        JSON.stringify({
          event: 'message.receive',
          data: {
            id,
            sender,
            text,
            timestamp: data?.timestamp || new Date().toISOString(),
          },
        }),
      );
    }

    // Acknowledge back to sender that message was delivered
    client.send(
      JSON.stringify({
        event: 'message.delivered',
        data: { id, recipient, timestamp: Date.now() },
      }),
    );
  }

  @SubscribeMessage('call.invite')
  handleCallInvite(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const caller = this.socketToUser.get(client) || data?.caller || 'Anonymous';
    const recipient = (data?.recipient || '').trim().toLowerCase();
    const sdp = data?.sdp;
    const isVideo = data?.video ?? true;

    console.log(`[RealtimeGateway] Call invite from ${caller} to ${recipient}`);

    const recipientSocket = this.activeClients.get(recipient);
    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
      recipientSocket.send(
        JSON.stringify({
          event: 'call.incoming',
          data: {
            caller,
            sdp,
            video: isVideo,
          },
        }),
      );
    } else {
      // Recipient is offline or busy
      client.send(
        JSON.stringify({
          event: 'call.rejected',
          data: { reason: 'User offline or unavailable' },
        }),
      );
    }
  }

  @SubscribeMessage('call.answer')
  handleCallAnswer(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const caller = (data?.caller || '').trim().toLowerCase();
    const sdp = data?.sdp;

    const callerSocket = this.activeClients.get(caller);
    if (callerSocket && callerSocket.readyState === WebSocket.OPEN) {
      callerSocket.send(
        JSON.stringify({
          event: 'call.answered',
          data: { sdp },
        }),
      );
    }
  }

  @SubscribeMessage('call.ice_candidate')
  handleIceCandidate(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const recipient = (data?.recipient || '').trim().toLowerCase();
    const candidate = data?.candidate;

    const recipientSocket = this.activeClients.get(recipient);
    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
      recipientSocket.send(
        JSON.stringify({
          event: 'call.ice_candidate',
          data: { candidate },
        }),
      );
    }
  }

  @SubscribeMessage('call.end')
  handleCallEnd(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    const recipient = (data?.recipient || '').trim().toLowerCase();
    const recipientSocket = this.activeClients.get(recipient);
    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
      recipientSocket.send(
        JSON.stringify({
          event: 'call.ended',
          data: {},
        }),
      );
    }
  }
}
