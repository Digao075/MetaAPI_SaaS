import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './core/prisma/prisma.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { URL } from 'url';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    PrismaModule,
    AuthModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        const url = new URL(redisUrl);
        const redisOptions = {
          host: url.hostname,
          port: parseInt(url.port), 
          password: url.password, 
          username: url.username, 
          tls: {
            rejectUnauthorized: false,
          },
        };
  return {
          redis: redisOptions,
        };
      },
    }),

    WhatsappModule,
  ],
  controllers: [], 
  providers: [],  
})
export class AppModule {}