import { Controller, Post, Body, Get, Query, Logger, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { WhatsappSendingService } from './whatsapp-sending.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import axios from 'axios';

@Controller('v1/meta/webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    @InjectQueue('incoming-message') private readonly messageQueue: Queue,
    private readonly sendingService: WhatsappSendingService,
    private readonly prisma: PrismaService,
  ) {}

  // --- 1. RECEBIMENTO (WEBHOOK META) ---
  @Post()
  async handleWebhook(@Body() payload: any) {
    this.logger.log('Novo payload recebido do WhatsApp...');
    try {
      const phoneNumberId =
        payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

      if (!phoneNumberId) return { status: 'OK' };

      await this.messageQueue.add('process-whatsapp-message', {
        phoneNumberId: phoneNumberId,
        payload: payload,
      });
    } catch (error) {
      this.logger.error('Erro ao enfileirar job', error.stack);
    }
    return { status: 'OK' };
  }

  // --- 2. VERIFICAÇÃO (CHALLENGE META) ---
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    const WEBHOOK_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      this.logger.log('Webhook verificado com sucesso!');
      return challenge;
    } else {
      throw new Error('Verification token mismatch');
    }
  }

  // --- 3. ENVIO DE MENSAGEM (API INTERNA) ---
  @Post('/send-text')
  async handleSendMessage(
    @Body()
    body: {
      tenantId: string;
      userId: string;
      contactWaId: string;
      text: string;
    },
  ) {
    this.logger.log(`Nova solicitação de envio para ${body.contactWaId}`);
    await this.sendingService.sendTextMessage(
      body.tenantId,
      body.userId,
      body.contactWaId,
      body.text,
    );
    return { status: 'OK', message: 'Mensagem enviada e salva no DB' };
  }

  // --- 4. LEITURA DE DADOS (FRONTEND) ---
  @Get('/chat/:tenantId/contacts')
  async getContacts(@Param('tenantId') tenantId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return contacts;
  }

  @Get('/chat/:tenantId/messages/:contactId')
  async getMessages(
    @Param('tenantId') tenantId: string,
    @Param('contactId') contactId: string,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        contactId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    return messages;
  }

  // --- 5. ATUALIZAÇÃO DE STATUS (KANBAN + WEBHOOK SAÍDA) ---
  @Post('/chat/:tenantId/contacts/:contactId/status')
  async updateContactStatus(
    @Param('tenantId') tenantId: string,
    @Param('contactId') contactId: string,
    @Body() body: { status: string },
  ) {
    const updatedContact = await this.prisma.contact.update({
      where: { id: contactId },
      data: { status: body.status },
    });

    this.logger.log(`Contato ${contactId} movido para ${body.status}`);

    if (body.status === 'CLOSED') {
      this.dispararWebhookExterno(tenantId, updatedContact);
    }

    return updatedContact;
  }

  private async dispararWebhookExterno(tenantId: string, contactData: any) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (tenant && tenant.webhookUrl) {
        this.logger.log(`🚀 Disparando Webhook para: ${tenant.webhookUrl}`);
        
        await axios.post(tenant.webhookUrl, {
          event: 'contact_updated',
          timestamp: new Date(),
          data: contactData,
        });
        
        this.logger.log('✅ Webhook enviado com sucesso!');
      }
    } catch (error) {
      this.logger.error('❌ Falha ao enviar webhook externo', error.message);
    }
  }
}