import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class WhatsappSendingService {
  private readonly logger = new Logger(WhatsappSendingService.name);

  constructor(private readonly prisma: PrismaService) {}


  async sendTextMessage(
    tenantId: string,
    senderUserId: string,
    contactWaId: string,
    text: string,
  ) {
    this.logger.log(`Enviando: "${text}" para ${contactWaId}`);

    const connection = await this.prisma.whatsappConnection.findUnique({
      where: { tenantId: tenantId },
    });

    const contact = await this.prisma.contact.findUnique({
      where: {
        tenantId_whatsapp_number: {
          tenantId: tenantId,
          whatsapp_number: contactWaId,
        },
      },
    });

    if (!connection) throw new Error(`Tenant ${tenantId} não tem conexão WPP.`);
    if (!contact) throw new Error(`Contato ${contactWaId} não encontrado.`);

    const accessToken = this.decryptToken(connection.access_token_encrypted);
    const phoneNumberId = connection.phone_number_id;

    try {
      this.logger.log('--- MOCK: CHAMANDO API DA META ---');
      this.logger.log(`> TOKEN: ${accessToken}`);
      this.logger.log(`> TO: ${contactWaId}`);
      this.logger.log(`> BODY: ${text}`);
      this.logger.log('------------------------------------');

    } catch (error) {
      this.logger.error('Erro ao enviar mensagem para a Meta', error);
      throw error;
    }


    const savedMessage = await this.prisma.message.create({
      data: {
        tenantId: tenantId,
        contactId: contact.id,
        content: text,
        messageType: 'text',
        direction: 'outgoing',
        timestamp: new Date(),
        sentByUserId: senderUserId, 
      },
    });

    this.logger.log(`Mensagem 'outgoing' salva no DB (ID: ${savedMessage.id})`);
    return savedMessage;
  }


  private decryptToken(encryptedToken: string): string {
    this.logger.warn(
      `[MOCK] Descriptografando token "${encryptedToken}"...`,
    );

    return encryptedToken;
  }
}