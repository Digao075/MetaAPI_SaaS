import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user; 
        return result;
      }
    }
    return null;
  }


  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      tenantId: user.tenantId
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
async sendRecoveryEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const recoveryLink = `https://seusaas.com/reset-password?token=simulacao123`;
      
      this.logger.warn(`==================================================`);
      this.logger.warn(`📧 [MOCK EMAIL] Enviando para: ${email}`);
      this.logger.warn(`🔗 Link: ${recoveryLink}`);
      this.logger.warn(`==================================================`);
    }
    
    return true;
    }
  }