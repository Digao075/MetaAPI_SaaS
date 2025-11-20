import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappProcessor } from './whatsapp.processor';
import { WhatsappSendingService } from './whatsapp-sending.service';
import { WhatsappGateway } from './whatsapp.gateway';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [

    BullModule.registerQueue({
      name: 'incoming-message',
    }),
  ],
  controllers: [
    WhatsappController,
    PaymentController
  ],
  providers: [
    WhatsappProcessor,
    WhatsappSendingService,
    WhatsappGateway,
    PaymentService.
  ],
  exports: [WhatsappGateway]
})
export class WhatsappModule {}