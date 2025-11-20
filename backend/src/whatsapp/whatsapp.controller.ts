import { Controller, Post, Body, Get, Query, Logger, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { WhatsappSendingService } from './whatsapp-sending.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import axios from 'axios';
import { PLAN_LIMITS } from 'src/core/config/plans.config';

@Controller('v1/meta/webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    @InjectQueue('incoming-message') private readonly messageQueue: Queue,
    private readonly sendingService: WhatsappSendingService,
    private readonly prisma: PrismaService,
  ) {}

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
  @Get('/dashboard/:tenantId/stats')
  async getDashboardStats(@Param('tenantId') tenantId: string) {
    const totalContacts = await this.prisma.contact.count({
      where: { tenantId },
    });

    const contactsByStatus = await this.prisma.contact.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const messagesToday = await this.prisma.message.count({
      where: {
        tenantId,
        timestamp: {
          gte: today, 
        },
      },
    });

    const incomingCount = await this.prisma.message.count({
      where: { tenantId, direction: 'incoming' },
    });
    const outgoingCount = await this.prisma.message.count({
      where: { tenantId, direction: 'outgoing' },
    });

    return {
      totalContacts,
      messagesToday,
      contactsByStatus: contactsByStatus.map(item => ({
        status: item.status || 'OPEN',
        count: item._count.id
      })),
      messagesAnalysis: {
        incoming: incomingCount,
        outgoing: outgoingCount
      }
    };
  }
  @Get('/settings/:tenantId')
  async getSettings(@Param('tenantId') tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { connections: true },
    });

    if (!tenant) throw new Error('Tenant não encontrado');

    return {
      name: tenant.name,
      webhookUrl: tenant.webhookUrl,
      connections: tenant.connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        phoneId: conn.phone_number_id,
        hasToken: !!conn.access_token_encrypted
  }))
    };
  }

@Post('/settings/:tenantId/connections')
  async addConnection(
    @Param('tenantId') tenantId: string,
    @Body() body: { name: string; phoneId: string; token: string },
  ) {

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { 
        _count: { select: { connections: true } } 
      }
    });
    if (!tenant) throw new Error('Tenant não encontrado');
    
const currentPlan = tenant.plan || 'FREE'; 
    const limits = PLAN_LIMITS[currentPlan];
    const currentConnections = tenant._count.connections;

    if (currentConnections >= limits.maxConnections) {
      throw new Error(
        `Seu plano ${currentPlan} permite apenas ${limits.maxConnections} conexões. Faça upgrade para adicionar mais.`
      );
    }

    const newConnection = await this.prisma.whatsappConnection.create({
      data: {
        tenantId,
        name: body.name,
        phone_number_id: body.phoneId,
        access_token_encrypted: body.token,
      },
    });

    return { status: 'OK', message: 'Conexão adicionada!', data: newConnection };
  }
  @Post('/settings/:tenantId/connections/:connId/delete') 
  async deleteConnection(
    @Param('tenantId') tenantId: string,
    @Param('connId') connId: string,
  ) {
    await this.prisma.whatsappConnection.deleteMany({
      where: {
        id: connId,
        tenantId: tenantId 
      }
    });
    return { status: 'OK' };
  }
}