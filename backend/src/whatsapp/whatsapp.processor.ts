import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { WhatsappGateway } from './whatsapp.gateway';
import { WhatsappSendingService } from './whatsapp-sending.service';

@Processor('incoming-message')
export class WhatsappProcessor {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: WhatsappGateway,
    private readonly sendingService: WhatsappSendingService,
  ) {}

  @Process('process-whatsapp-message')
  async handleProcessMessage(job: Job) {
    const { phoneNumberId, payload } = job.data;

    try {
      const messageData = payload.entry[0].changes[0].value.messages[0];
      const contactData = payload.entry[0].changes[0].value.contacts[0];

      const contactWaId = contactData.wa_id;
      const contactName = contactData.profile.name;
      const messageBody = messageData.text?.body || ''; 
      const messageType = messageData.type;
      const messageTimestamp = new Date(parseInt(messageData.timestamp) * 1000);

      const connection = await this.prisma.whatsappConnection.findUnique({
        where: { phone_number_id: phoneNumberId },
      });

      if (!connection) {
        throw new Error(
          `Tenant não encontrado para phone_number_id: ${phoneNumberId}`,
        );
      }

      const tenantId = connection.tenantId;

      const contact = await this.prisma.contact.upsert({
        where: {
          tenantId_whatsapp_number: {
            tenantId: tenantId,
            whatsapp_number: contactWaId,
          },
        },
        update: {
          name: contactName,
        },
        create: {
          tenantId: tenantId,
          whatsapp_number: contactWaId,
          name: contactName,
        },
      });

      const savedMessage = await this.prisma.message.create({
        data: {
          tenantId: tenantId,
          contactId: contact.id,
          content: messageBody,
          messageType: messageType,
          direction: 'incoming',
          timestamp: messageTimestamp,
          sentByUserId: null,
        },
      });

      this.logger.log(`Job #${job.id}: Mensagem de ${contactName} salva no DB.`);

      this.gateway.enviarMensagemParaFrontend(tenantId, savedMessage);

      if (
        messageType === 'text' &&
        messageBody.toLowerCase().trim() === 'menu'
      ) {
        this.logger.log(`🤖 BOT: Palavra-chave 'menu' detectada! Respondendo...`);

        await new Promise((r) => setTimeout(r, 1000));

        const respostaDoBot = `Olá ${contactName}! 👋\nEu sou o Robô do SaaS.\n\nEscolha uma opção:\n1. Falar com Atendente\n2. Ver Planos\n3. Suporte`;

        const botMessage = await this.sendingService.sendTextMessage(
          tenantId,
          'user-1', 
          contactWaId,
          respostaDoBot,
        );

        this.gateway.enviarMensagemParaFrontend(tenantId, botMessage);
      }

    } catch (error) {
      this.logger.error(`Job #${job.id} falhou`, error.stack);
      throw error;
    }
  }
}