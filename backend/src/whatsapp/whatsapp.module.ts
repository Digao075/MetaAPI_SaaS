import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappProcessor } from './whatsapp.processor';
import { WhatsappSendingService } from './whatsapp-sending.service';
import { WhatsappGateway } from './whatsapp.gateway';

@Module({
  imports: [

    BullModule.registerQueue({
      name: 'incoming-message',
    }),
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappProcessor,
    WhatsappSendingService,
    WhatsappGateway,
  ],
  exports: [WhatsappGateway]
})
export class WhatsappModule {}