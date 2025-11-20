import { Controller, Post, Body, Headers, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('v1/webhooks')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}


  @Post('asaas')
  async handleAsaasWebhook(@Body() body: any, @Headers('asaas-access-token') token: string) {    
    this.logger.log('Recebido Webhook Asaas:', body.event);


    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {

      const emailCliente = body.payment.email || body.customer.email; 
      const descricaoPlano = body.payment.description || 'Plano desconhecido'; 
      if (emailCliente) {
        await this.paymentService.upgradeTenantByEmail(emailCliente, descricaoPlano);
      }
    }

    return { received: true };
  }

  @Post('crypto')
  async handleCryptoWebhook(@Body() body: any, @Headers('x-nowpayments-sig') signature: string) {
    this.logger.log('Recebido Webhook Crypto');

    if (body.payment_status === 'finished' || body.event?.type === 'charge:confirmed') {
      
      const emailCliente = body.order_description || body.metadata?.email;
      const valor = body.price_amount; 

      let plano = 'FREE';
      if (valor >= 90 && valor <= 110) plano = 'STARTER'; 
      if (valor >= 190) plano = 'PRO'; 

      if (emailCliente) {
        await this.paymentService.upgradeTenantByEmail(emailCliente, plano);
      }
    }

    return { received: true };
  }
}