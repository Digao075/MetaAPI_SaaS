import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true }) 
export class WhatsappGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() server: Server;
  private logger = new Logger('WhatsappGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }


  enviarMensagemParaFrontend(tenantId: string, mensagem: any) {

    this.server.emit('nova-mensagem', mensagem); 
    this.logger.log(`Evento 'nova-mensagem' enviado via WebSocket!`);
  }
}