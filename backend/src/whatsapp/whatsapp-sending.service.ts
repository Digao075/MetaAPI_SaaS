import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import axios from 'axios';

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
    this.logger.log(`Preparando envio para ${contactWaId}...`);

    const connection = await this.prisma.whatsappConnection.findFirst({
      where: { tenantId: tenantId },
    });

    if (!connection) throw new Error(`Tenant ${tenantId} sem conexão.`);


    const accessToken = connection.access_token_encrypted; 
    const phoneNumberId = connection.phone_number_id;

    if (accessToken === 'token-pendente') {
        this.logger.warn('⚠️ Tentativa de envio com TOKEN PENDENTE. Configure em Settings.');
        return;
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: contactWaId,
      type: 'text',
      text: { body: text },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {

      await axios.post(url, payload, { headers });
      this.logger.log(`✅ Mensagem enviada com sucesso na Meta!`);
    } catch (error: any) {

      this.logger.error('❌ Erro na API da Meta:', error.response?.data || error.message);

    }

    const contact = await this.prisma.contact.findUnique({
        where: {
          tenantId_whatsapp_number: {
            tenantId,
            whatsapp_number: contactWaId
          }
        }
    });

    if(contact) {
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
        this.logger.log(`Mensagem salva no histórico (ID: ${savedMessage.id})`);
        return savedMessage;
    }
  }
  async sendMediaMessage(
    tenantId: string,
    senderUserId: string,
    contactWaId: string,
    mediaUrl: string,
    mediaType: string,
    caption: string = '',
  ) {
    const connection = await this.prisma.whatsappConnection.findFirst({ where: { tenantId } });
    if (!connection) throw new Error(`Tenant ${tenantId} sem conexão.`);

    const accessToken = connection.access_token_encrypted;
    const phoneNumberId = connection.phone_number_id;

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
    const payload: any = {
      messaging_product: 'whatsapp',
      to: contactWaId,
      type: mediaType,
    };

    payload[mediaType] = { link: mediaUrl };
    
    if (mediaType !== 'audio' && caption) {
        payload[mediaType].caption = caption;
        if (mediaType === 'document') payload[mediaType].filename = caption; 
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(url, payload, { headers });
      this.logger.log(`✅ Mídia (${mediaType}) enviada com sucesso!`);
    } catch (error: any) {
      this.logger.error('❌ Erro na API da Meta:', error.response?.data || error.message);
    }

    const contact = await this.prisma.contact.findFirst({ where: { tenantId, whatsapp_number: contactWaId } });
    if (contact) {
        await this.prisma.message.create({
            data: {
                tenantId,
                contactId: contact.id,
                content: mediaUrl,
                messageType: mediaType,
                direction: 'outgoing',
                timestamp: new Date(),
                sentByUserId: senderUserId,
            }
        });
    }
  }
}